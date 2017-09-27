const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

const config = require('./Config');

const app = express();
const logger = new (winston.Logger)({
  colors: config.loggerSettings.colors,
  transports: [
    new (winston.transports.Console)({level: 'info', colorize: true}),
  ],
});


// Passport
passport.use(new SamlStrategy(
  {
    path: '/login/callback',
    entryPoint: config.identityProvider.url,
    issuer: config.identityProvider.issuer
  },
  function (profile, done) {
    return done(null,
      {
        id: profile['http://schemas.microsoft.com/identity/claims/objectidentifier'],
        name: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
      });
  })
);
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});


// Express settings
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

// Express middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.hostingEnvironment.sessionSecret
}));
app.use(morgan('combined', {stream: fs.createWriteStream('./access.log', {flags: 'a'})}));
app.use(morgan('dev'));
app.use(passport.initialize());
app.use(passport.session());


// Routes
app.get('/', function (req, res) {
  res.render('index', {
    isLoggedIn: req.isAuthenticated(),
    user: req.user ? req.user : {id: '', name: ''}
  });
});

app.get('/login',
  passport.authenticate('saml',
    {
      successRedirect: '/',
      failureRedirect: '/login'
    })
);

app.post('/login/callback',
  passport.authenticate('saml',
    {
      failureRedirect: '/',
      failureFlash: true
    }),
  function (req, res) {
    res.redirect('/');
  }
);


// Setup server
if (config.hostingEnvironment.env === 'dev') {
  app.proxy = true;

  const https = require('https');
  const options = {
    key: fs.readFileSync('./ssl/localhost.key'),
    cert: fs.readFileSync('./ssl/localhost.cert'),
    requestCert: false,
    rejectUnauthorized: false,
  };
  const server = https.createServer(options, app);

  server.listen(config.hostingEnvironment.port, () => {
    logger.info(`Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port} with config:\n${JSON.stringify(config)}`);
  });
} else {
  app.listen(config.hostingEnvironment.port, () => {
    logger.info(`Server listening on http://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
  });
}