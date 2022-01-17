import fetch from 'node-fetch';
import * as fs from 'fs';

export default class HomeConnect {

  savedAuth = {};
  service = 'homeconnect';
  MS = 1000;
  TOKEN_REFRESH_WINDOW = 60 * 60; // (seconds)
  AUTH_RETRY_DELAY    = 60; // (seconds)
  REFRESH_RETRY_DELAY = 5;  // (seconds)
  scopes = [];
  sleepReject = {};
  requestCount = 0;
  url = 'https://api.home-connect.com';

  constructor(options) {
    if (options.savedAuth) {
      this.savedAuth = options.savedAuth;
    }

    this.service = options.service;
    this.clientID = options.client_id;
    if (this.service === 'homeconnect') {
      this.scopes = ['IdentifyAppliance', 'Monitor', 'Settings', 'Control'];
    }
  }

  sleep(milliseconds, id) {
    return new Promise((resolve, reject) => {
      if (id) this.sleepReject[id] = reject;
      setTimeout(resolve, milliseconds);
    });
  }
  async authoriseClient() {
    while (true) {
      try {
        // authorise this client if there is no saved authorisation
        if (!this.savedAuth[this.clientID]) {
          let token = await this.authDeviceFlow();
          this.tokenSave(token);
        } else if (this.savedAuth[this.clientID].scopes) {
          this.scopes = this.savedAuth[this.clientID].scopes;
        }

        // Refresh the access token before it expires
        while (true) {
         // Check the validity of the current access token
          let auth = this.savedAuth[this.clientID];
          let refreshIn = auth.accessExpires - Date.now() - this.TOKEN_REFRESH_WINDOW * this.MS;
          if (auth.accessToken && 0 < refreshIn) {
            // Resolve any promises awaiting authorisation
            this.authResolve = [];
            // Delay before refreshing the access token
            console.log('Refreshing access token in ' + Math.floor(refreshIn / this.MS) + ' seconds');
            await this.sleep(refreshIn, 'refresh');
          }

          // Refresh the access token
          let token = await this.tokenRefresh(auth.refreshToken);
          this.tokenSave(token);
        }
      } catch (err) {
        // Discard any access token and report the error
        this.tokenInvalidate();
        // Delay before retrying authorisation
        let retryIn = this.savedAuth[this.clientID] ? this.REFRESH_RETRY_DELAY : this.AUTH_RETRY_DELAY;
        console.warn('Retrying client authentication in ' + retryIn + ' seconds');
        await this.sleep(retryIn * this.MS);
      }
    }
  }

  waitUntilAuthorised() {
    // Resolve immediately if already authorised, otherwise add to queue
    let auth = this.savedAuth[this.clientID];
    if (auth && auth.accessToken && Date.now() < auth.accessExpires) {
      return Promise.resolve();
    } else {
      return new Promise(resolve => this.authResolve.push(resolve));
    }
  }

  // Obtain the current access token (or throw an error if not authorised)
  getAuthorisation() {
    let token = this.savedAuth[this.clientID].accessToken;
    if (!token) throw new Error('Home Connect client is not authorised');
    return 'Bearer ' + token;
  }

  tokenSave(token) {
    let truncate = s => s.substring(0, 4) + '...' + s.substring(s.length - 8) + ' (' + s.length + ' characters)';
    console.debug('Refresh token ' + truncate(token.refresh_token));
    console.debug('Access token  ' + truncate(token.access_token) + ' (expires after ' + token.expires_in + ' seconds)');

    // Save the refresh and access tokens, plus the authenticated scopes
    this.savedAuth[this.clientID] = {
      refreshToken:   token.refresh_token,
      accessToken:    token.access_token,
      accessExpires:  Date.now() + token.expires_in * this.MS,
      scopes:         this.scopes
    };
    fs.writeFile(`./tokens/${this.service}.json`, JSON.stringify(this.savedAuth), (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  async authDeviceFlow() {
    // Obtain verification URI
    console.log('Requesting Home Connect authorisation using the Device Flow');
    let request = await this.requestRaw({
      method:  'POST',
      url:     this.url + '/security/oauth/device_authorization',
      json:    true,
      form:    {
        client_id: this.clientID,
        scope: this.scopes.join(' ')
      }
    });
    let resp = await request.json();
    console.log(resp);
    console.log('Please authorize here: ', resp.verification_uri_complete);
    console.log('Waiting for completion of Home Connect authorisation'
                   + ' (poll every ' + resp.interval + ' seconds,'
                   + ' device code ' + resp.device_code + ' expires'
                   + ' after ' + resp.expires_in + ' seconds)...');

    // Wait for the user to authorise access (or expiry of device code)
    let token;
    while (!token) {
      // Wait for the specified poll interval
      await this.sleep(30 * this.MS);
      console.log('Gonna try now');

      // Poll for a device access token (returns null while auth pending)
      let tokenRequest = await this.requestRaw({
        method:  'POST',
        url:     this.url + '/security/oauth/token',
        json:    true,
        form:    {
          client_id:      this.clientID,
          grant_type:     'device_code',
          device_code:    resp.device_code
        }
      });
      token = await tokenRequest.json();
    }

    // Return the access token
    console.log("Returning...");
    console.log(token);
    return token;
  }

  async tokenRefresh(refreshToken) {
    // Request a refresh of the access token
    console.log('Refreshing Home Connect access token');
    let tokenRequest = await this.requestRaw({
      method:  'POST',
      url:     this.url + '/security/oauth/token',
      json:    true,
      form:    {
        grant_type:     'refresh_token',
        refresh_token:  refreshToken
      }
    });

    const token = await tokenRequest.json();

    // Request returns null if authorisation is pending (shouldn't happen)
    if (!token) throw new Error('authorisation pending');

    // Return the refreshed access token
    return token;
  }

  // Invalidate saved authentication data if server indicates it is invalid
  authInvalidate() {
    delete this.savedAuth[this.clientID];
    this.wake('refresh', new Error('Client authentication invalidated'));
  }

  // Invalidate the current access token if server indicates it is invalid
  tokenInvalidate() {
    let auth = this.savedAuth[this.clientID];
    if (auth) delete auth.accessToken;
    this.wake('refresh', new Error('Access token invalidated'));
  }

  // Delay before issuing another request if the server indicates rate limit
  retryAfter(delaySeconds) {
    let earliest = Date.now() + delaySeconds * this.MS;
    if (this.earliestRetry < earliest) {
      this.earliestRetry = earliest;
    }
  }

  wake(id, err) {
    let reject = this.sleepReject[id];
    if (reject) reject(err || new Error('Sleep aborted'));
  }

  async requestRaw(options) {
    // Log the request
    let logPrefix = 'Home Connect request #' + ++this.requestCount + ': ';
    console.debug(logPrefix + options.method + ' ' + options.url);

    // Issue the request
    try {
      var formBody = [];
      for (var property in options.form) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(options.form[property]);
        formBody.push(encodedKey + "=" + encodedValue);
      }
      formBody = formBody.join("&");

      return await fetch(options.url, {
        method: options.method,
        body: formBody,
        headers: {
          // 'Content-Type': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (err) {
      console.error('Fuuuuck');
      // Status codes returned by the server have special handling
      // status = err.message;
      if (err.name === 'StatusCodeError') {
        // Redirection is not an error when expected
        if (!options.followRedirect && err.statusCode === 302) {
          let uri = err.response.headers['location'];
          // status = 'Redirect ' + uri;
          return uri;
        }
      }
    }
  }
}
