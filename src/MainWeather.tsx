import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Forecast } from 'owm-onecall-api';
import { kToC, isNight } from './helpers';
import 'weather-react-icons/lib/css/weather-icons.css';
import 'weather-react-icons/lib/css/weather-icons-wind.css';
import { WeatherIcon } from 'weather-react-icons';

interface MainWeatherProps {
  weatherData: Forecast | undefined;
  localTime: string;
}

export default class MainWeather extends React.Component<MainWeatherProps> {
  getWindClass = (degree: number): string => {
    return `wi wi-wind from-${degree}-deg`;
  }
  render() {
    const weatherData = this.props.weatherData;
    if (weatherData?.current) {
      return (
        <Box sx={{ flexGrow: 1 }}>
          <Grid container direction="column">
            <Grid container>
              <Grid item xs sx={{paddingLeft: '1rem'}}>
                <h1>
                  {this.props.localTime}
                </h1>
              </Grid>
              <Grid item xs>
                <h1>
                  <WeatherIcon iconId={weatherData.current.weather[0].id} name="owm" night={isNight(weatherData)} />
                </h1>
              </Grid>
              <Grid item xs>
                <h1>
                  {kToC(weatherData.current.temp)}°
                </h1>
              </Grid>
            </Grid>
            <Grid container sx={{textAlign: 'left', paddingLeft: '2rem'}}>
              <Grid item xs>
                <i className='wi wi-direction-up'></i>
                {' '}
                {weatherData.daily && kToC(weatherData.daily[0].temp.max)}°
              </Grid>
              <Grid item xs>
                Feels: {kToC(weatherData.current.feels_like)}°
              </Grid>
              <Grid item xs>
                <i className="wi wi-sunrise"></i>
                {' '}
                {new Date(weatherData.current.sunrise).toLocaleTimeString([], {timeStyle: 'short'})}
              </Grid>
            </Grid>
            <Grid container sx={{textAlign: 'left', paddingLeft: '2rem'}}>
              <Grid item xs>
                <i className='wi wi-direction-down'></i>
                {' '}
                {weatherData.daily && kToC(weatherData.daily[0].temp.min)}°
              </Grid>
              <Grid item xs>
              {weatherData.current.humidity}
              {' '}
              <i className="wi wi-humidity"></i>
              </Grid>
              <Grid item xs>
                <i className="wi wi-sunset"></i>
                {' '}
                {new Date(weatherData.current.sunset).toLocaleTimeString([], {timeStyle: 'short'})}
              </Grid>
            </Grid>
            <Grid container sx={{textAlign: 'left', paddingLeft: '2rem'}}>
              <Grid item xs>
              <i className={this.getWindClass(weatherData.current.wind_deg)}></i>
                {' '}
                {(weatherData.current.wind_speed * 3.6).toFixed(1)} km/h
              </Grid>
              <Grid item xs>
                {weatherData.current.rain && (
                  <i className='wi wi-raindrop'></i>
                )}
                {weatherData.current.snow && (
                  <i className='wi wi-snowflake-cold'></i>
                )}
              </Grid>
              <Grid item xs>
                {weatherData.alerts && (
                  <>
                    ⚠ Alerts
                  </>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      );
    }
    return (
      <>
        No weather data available
      </>
    );
  };
}
