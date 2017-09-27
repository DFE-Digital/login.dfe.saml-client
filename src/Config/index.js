const env = (process.env.NODE_ENV ? process.env.NODE_ENV : 'dev') || 'dev';
const isDev = env === 'dev';

module.exports = {
  loggerSettings: {
    levels: {
      info: 0,
      ok: 1,
      error: 2,
    },
    colors: {
      info: 'yellow',
      ok: 'green',
      error: 'red',
    },
  },
  hostingEnvironment: {
    env: env,
    host: process.env.HOST ? process.env.HOST : 'localhost',
    port: process.env.PORT ? process.env.PORT : 44301,
    protocol: isDev ? 'https' : 'http',
    sessionSecret: process.env.SESSION_SECRET ? process.env.SESSION_SECRET : 'flea-below-velocity-around'
  }
};