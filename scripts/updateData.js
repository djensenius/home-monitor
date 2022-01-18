import fetch from 'node-fetch';
import * as fs from 'fs';
import HomeConnect from './homeconnect.js';
import Miele from './miele.js';
import { mieleConsts, homeConnectConsts, robotConsts } from '../config.js';
import * as dorita980 from 'dorita980';
import RSS from 'rss-to-json';

if (fs.existsSync('./tokens/homeconnect.json')) {
  let fileContents = await JSON.parse(fs.readFileSync('./tokens/homeconnect.json'));
  homeConnectConsts['savedAuth'] = fileContents;
}

const getHomeConnectStatus = async (homeConnect, id) => {
  const url = `https://api.home-connect.com/api/homeappliances/${id}/programs/active`;
  const bearer = homeConnect.getAuthorisation();
  const response = await fetch(url, {
    method: 'get',
    headers: {
      'Accept': 'application/vnd.bsh.sdk.v1+json',
      'Authorization': bearer,
    }
  });
  return await response.json();
};

const getRobotStatus = async(blid, password, ip, name) => {
  if (name === 'BroomBot') {
    process.env.ROBOT_CIPHERS = 'TLS_AES_256_GCM_SHA384';
  } else {
    process.env.ROBOT_CIPHERS = 'AES128-SHA256';
  }
  const robot = new dorita980.Local(blid, password, ip);
  robot.on('connect', () => {
    if (robot.options.host === '192.168.1.222') {
      process.env.ROBOT_CIPHERS = 'TLS_AES_256_GCM_SHA384';
    } else {
      process.env.ROBOT_CIPHERS = 'AES128-SHA256';
    }
    robot.getRobotState(['batPct', 'cleanMissionStatus']).then((result) => {
      robot.end();
      fs.writeFile(`./status/${name}.json`, JSON.stringify(result), (err) => {
        if (err) {
          console.error(`Error ${err.msg}`);
        }
        console.log(`${name} updated`);
      });
    });
  });
}

setInterval(() => {
  for (let robots = 0; robots < robotConsts.names.length  /* robots < 2 */; robots += 1) {
    getRobotStatus(robotConsts.blids[robots], robotConsts.passwords[robots], robotConsts.ips[robots], robotConsts.names[robots]);
  }
}, 30000)

const homeConnect = new HomeConnect(homeConnectConsts);
homeConnect.authoriseClient();
let homeConnectResponse;
setInterval(async () => {
  homeConnectResponse = await getHomeConnectStatus(homeConnect, homeConnectConsts.appliances[0]);
  homeConnectResponse.lastUpdated = new Date();
  fs.writeFile(`./status/${homeConnectConsts.appliances[0]}.json`, JSON.stringify(homeConnectResponse), (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Wrote HomeConnect');
    }
  });
}, 15000);

const miele = new Miele();

setInterval(async () => {
  for (let i = 0; i < mieleConsts.appliances.length; i += 1) {
    let appliance = mieleConsts.appliances[i];
    let mieleResponse = await miele.updateAppliance(appliance);
    mieleResponse.lastUpdated = new Date();
    fs.writeFile(`./status/${appliance}.json`, JSON.stringify(mieleResponse), (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Wrote Miele');
      }
    });
  }
}, 15000);

setInterval(async () => {
  const feed = await RSS.parse('https://www.cbc.ca/cmlink/rss-topstories', {});
  fs.writeFile('./status/cbc.json', JSON.stringify(feed), (err) => {
    if (err) {
      console.log('Bad news day');
    }
  });
}, 600000);
