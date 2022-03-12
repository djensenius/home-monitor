import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import { buildOpenWeatherMapRequest, Forecast } from 'owm-onecall-api'
import {
  mieleConsts,
  homeConnectConsts,
  openWeatherMapConsts,
  robotConsts,
} from './config.js';
import { homeConnectToTimeLeft, mieleToTimeLeft } from './helpers';
import ApplianceView, { Appliance } from './Appliance';
import MainWeather from './MainWeather';
import MiniWeather from './MiniWeather';
import News from './News';
import './App.css';

const owm = buildOpenWeatherMapRequest(openWeatherMapConsts.apiKey, openWeatherMapConsts.latitude, openWeatherMapConsts.longitude);

export const App = () => {
  const [weatherData, setWeatherData] = React.useState<Forecast>();
  const [appliances, setAppliances] = React.useState<Record<string, Appliance>>({});
  const [robots, setRobots] = React.useState<Record<string, Appliance>>({});
  const [localTime, setLocalTime] = React.useState<string>(new Date().toLocaleTimeString([], { timeStyle: 'short' }));

  const refreshWeather = async () => {
    owm.execute()
      .then((result) => {
        console.log('Weather refreshed');
        console.log(result);
        setWeatherData(result);
      }).catch((err) => {
        console.log(err);
      });
  };

  const refreshAppliances = async () => {
    // This is fragile
    let applianceArray = mieleConsts.appliances.concat(homeConnectConsts.appliances);
    let appliance: Record<string, Appliance> = {};
    for (let i = 0; i < applianceArray.length; i += 1) {
      let response = await fetch(`status/${applianceArray[i]}.json`);
      let result = await response.json();
      if (i === 2) {
        // Bosch
        if (result.error) {
          appliance['dishwasher'] = {
            icon: 'dishwasher.svg',
            on: false,
            name: 'Dishwasher',
          }
        } else {
          appliance['dishwasher'] = {
            icon: 'dishwasher.svg',
            on: true,
            name: 'Dishwasher',
          }
          let program = result.data.key;
          if (program === 'Dishcare.Dishwasher.Program.Auto2') {
            program = 'Auto';
          }
          appliance['dishwasher'].program = program;
          for (let j = 0; j < result.data.options.length; j += 1) {
            const option = result.data.options[j];
            if (option.key === 'BSH.Common.Option.RemainingProgramTime') {
              const seconds = option.value;
              const timeRemaining = homeConnectToTimeLeft(seconds);
              appliance['dishwasher'].timeRemaining = timeRemaining
            }
          }
        }
      } else {
        let name = 'washer';
        let on = (result.state.status.value_localized === "Off" || result.state.status.value_localized === "Not connected") ? false : true;
        if (i === 0) {
          name = 'washer';
          appliance[name] = {
            icon: 'washer.svg',
            name: 'Washing Machine',
            on,
          }
        } else if (i === 1) {
          name = 'dryer';
          appliance[name] = {
            icon: 'dryer.svg',
            name: 'Dryer',
            on,
          };
        }
        if (on) {
          let program = result.state.ProgramID.value_localized;
          const step = result.state.programPhase.value_localized;
          if (step) {
            program += ` (${step})`;
          }
          appliance[name].program = program;
          appliance[name].timeRemaining = mieleToTimeLeft(result.state.remainingTime[0], result.state.remainingTime[1]);
        }
      }
    }
    setAppliances(appliance);
  }

  const refreshRobots = async () => {
    let myRobots: Record<string, Appliance> = {};
    for (let i = 0; i < robotConsts.names.length; i += 1) {
      let name = robotConsts.names[i];
      let response = await fetch(`status/${name}.json`);
      let result = await response.json();
      const on = result.cleanMissionStatus.cycle === 'none' ? false: true;
      if (name === 'BroomBot') {
        myRobots[name] = {
          icon: 'broom.svg',
          name,
          on,
        };
        if (on) {
          myRobots[name].program = `Sweeping`;
        } else {
          myRobots[name].program = `Napping`;
        }
        if (result.bin.full) {
          myRobots[name].program = 'Bin full!'
        }
      } else {
        myRobots[name] = {
          icon: 'mop.svg',
          name,
          on,
        };
        if (on) {
          myRobots[name].program = `Mopping`;
        } else {
          myRobots[name].program = `Napping`;
        }
        if (!result.mopReady.lidClosed) {
          myRobots[name].program = 'Close lid'
        }
        if (!result.mopReady.tankPresent) {
          myRobots[name].program = 'Fill tank'
        }
      }
      if (result.batPct < 100) {
        myRobots[name].program += ` (${result.batPct}%)`
      }
    }
    setRobots(myRobots);
  }

  React.useEffect(() => {
    refreshWeather();
    refreshAppliances();
    refreshRobots();
    setInterval(() => {
      refreshWeather();
    }, 300000);

    setInterval(() => {
      refreshAppliances();
      refreshRobots();
    }, 30000)

    setInterval(() => {
      const dateString = new Date().toLocaleTimeString([], { timeStyle: 'short' });
      setLocalTime(dateString);
    }, 3000)
  }, []);

  return (
    <div className="App">
      <Box sx={{ flexGrow: 1 }}>
        <Grid container>
          <Grid item xs>
            <MainWeather weatherData={weatherData} localTime={localTime} />
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item xs>
            <Grid container direction="column">
              <Grid item xs>
                {(weatherData && weatherData.daily) && (
                  <MiniWeather weatherData={weatherData.daily[1]} />
                )}
              </Grid>
              <Divider flexItem />
              <Grid item xs>
                {(weatherData && weatherData.daily) && (
                  <MiniWeather weatherData={weatherData.daily[2]} />
                )}
              </Grid>
              <Divider flexItem />
              <Grid item xs>
                {(weatherData && weatherData.daily) && (
                  <MiniWeather weatherData={weatherData.daily[3]} />
                )}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Divider flexItem />
        <Grid container>
          <Grid item xs>
            {appliances['dishwasher'] && <ApplianceView appliance={appliances['dishwasher']} hideOff={false} />}
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item xs>
            {appliances['washer'] && <ApplianceView appliance={appliances['washer']} hideOff={false} />}
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item xs>
            {appliances['dryer'] && <ApplianceView appliance={appliances['dryer']} hideOff={false} />}
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item xs>
            {robots['BroomBot'] && <ApplianceView appliance={robots['BroomBot']} hideOff />}
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item xs>
          {robots['MopBot'] && <ApplianceView appliance={robots['MopBot']} hideOff />}
          </Grid>
        </Grid>
        <Divider flexItem />
        <News />
      </Box>
    </div>
  );
}

export default App;
