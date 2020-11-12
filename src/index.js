const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const formatXML = require('xml-formatter');
const cookieSession = require('cookie-session')

const config = require('./Config');

const app = express();
// const logger = new (winston.Logger)({
//   colors: config.loggerSettings.colors,
//   transports: [
//     new (winston.transports.Console)({ level: 'info', colorize: true })
//   ]
// });

const logger = console;


// Passport
passport.use(new SamlStrategy(
  {
    path: '/login/callback',
    entryPoint: config.identityProvider.url,
    issuer: config.identityProvider.issuer,
    authnRequestBinding: 'HTTP-POST',
    skipRequestCompression: true,
    additionalParams: {
      serviceId: 'b543b739-9791-4846-8638-cb35d66dd645',
      clientId: 'DAS',
      clientSecret: 'condiment-beetled-dreamy-milquetoast',
      samlTarget: 'https://localhost:44301/login/callback'
    }
  },
  function (profile, done) {
    let user = profile;
    user.id = profile['http://schemas.microsoft.com/identity/claims/objectidentifier'];
    user.name = profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];

    if (process.env.DISPLAY_XML) {
      fs.writeFile('assertion.xml', formatXML(profile.getAssertionXml()), () => { });
    }

    return done(null, { ...user });
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
app.set('trust proxy', 1)

// Express middleware
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(session({
//   resave: true,
//   saveUninitialized: true,
//   secret: config.hostingEnvironment.sessionSecret
// }));

app.use(cookieSession({
  name: 'session',
  keys: ['SUPER_SECRET_KEY_123'],

  // Cookie Options
  maxAge: 10 * 60 * 1000 // 10 mins
}));

app.use(morgan('combined', { stream: fs.createWriteStream('./access.log', { flags: 'a' }) }));
app.use(morgan('dev'));
app.use(passport.initialize());
app.use(passport.session());


// Routes
app.get('/', function (req, res) {

  let user_assertions = [];
  if (req.isAuthenticated()) {
    for (let i = 0; i < Object.keys(req.user).length; i++) {
      user_assertions.push(`${Object.keys(req.user)[i]} - ${req.user[Object.keys(req.user)[i]]}`)
    }
  }

  res.render('index', {
    isLoggedIn: req.isAuthenticated(),
    user_assertions,
    user: req.user ? req.user : { id: '', name: '' }
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
      failureRedirect: '/?error=true',
      successRedirect: '/',
      failureFlash: true
    })
);



// Setup server
if (config.hostingEnvironment.env === 'dev') {
  app.proxy = true;

  const http = require('https');
  const options = {
    key: fs.readFileSync('./ssl/localhost.key'),
    cert: fs.readFileSync('./ssl/localhost.cert'),
    requestCert: false,
    rejectUnauthorized: false
  };
  const server = http.createServer(options, app);

  console.log('started');

  server.listen(config.hostingEnvironment.port, () => {
    logger.info(`Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port} with config:\n${JSON.stringify(config)}`);
  });
} else {
  app.proxy = true;

  app.listen(config.hostingEnvironment.port, () => {
    logger.info(`Server listening on http://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
  });
}