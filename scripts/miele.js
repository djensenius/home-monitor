import * as fs from 'fs';
import fetch from 'node-fetch';
import { AuthorizationCode } from 'simple-oauth2';
import { mieleConsts } from '../config.js';

export default class Miele {
  constructor() {
    this.client = new AuthorizationCode({
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
  }

  async updateAppliance(appliance) {
    const fileContents = fs.readFileSync('./tokens/miele.json');
    let accessToken = this.client.createToken(JSON.parse(fileContents));

    const expireDate = new Date(accessToken.token.expires_at);
    if (expireDate < new Date()) {
      try {
        const refreshParams = {
          client_id: mieleConsts.mieleClientId,
          client_secret: mieleConsts.mieleSecretId,
        };

        accessToken = await accessToken.refresh(refreshParams);
        fs.writeFile('./tokens/miele.json', JSON.stringify(accessToken), (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log('Refreshed Miele auth');
          }
        });
      } catch (error) {
        console.error('Error refreshing Miele access token: ', error.message);
      }
    }

    const url = `https://api.mcs3.miele.com/v1/devices/${appliance}?language=en`;
    const bearer = `Bearer ${accessToken.token.access_token}`
    const response = await fetch(url, {
      method: 'get',
      headers: {
        'Accept': 'application/json',
        'charset': 'utf-8',
        'Authorization': bearer,
      }
    });
    const parsed = await response.json();
    return parsed;
  }
}
