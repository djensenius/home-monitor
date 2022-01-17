const createApplication = require('./authServer.cjs');
const { AuthorizationCode } = require('simple-oauth2');
const { mieleConsts } = require('../config');

createApplication(({ app, callbackUrl }) => {
  const client = new AuthorizationCode({
    client: {
      id: mieleConsts.mieleClientId,
      secret: mieleConsts.mieleSecretId,
    },
    auth: {
      tokenHost: 'https://api.mcs3.miele.com',
      tokenPath: '/thirdparty/token',
      authorizePath: '/thirdparty/login',
    },
  });

  // Authorization uri definition
  const authorizationUri = client.authorizeURL({
    redirect_uri: callbackUrl,
  });

  // Initial page redirecting to Github
  app.get('/auth', (req, res) => {
    console.log(authorizationUri);
    res.redirect(authorizationUri);
  });

  // Callback service parsing the authorization token and asking for the access token
  app.get('/callback', async (req, res) => {
    const { code } = req.query;
    const options = {
      code,
      vg: 'en-CA',
      client_id: mieleConsts.mieleClientId,
      client_secret: mieleConsts.mieleSecretId,
      redirect_uri: 'http://localhost:3000/callback'
    };

    try {
      const accessToken = await client.getToken(options);

      console.log('The resulting token: ', accessToken.token);

      return res.status(200).json(accessToken.token);
    } catch (error) {
      console.error('Access Token Error', error.message);
      console.log(error);
      return res.status(500).json('Authentication failed');
    }
  });

  app.get('/', (req, res) => {
    res.send('Hello<br><a href="/auth">Log in with Github</a>');
  });
});
