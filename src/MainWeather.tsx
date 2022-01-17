import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Forecast } from 'owm-onecall-api';
import { kToC, isNight } from './helpers';
import 'weather-react-icons/lib/css/weather-icons.css';
import { WeatherIcon } from 'weather-react-icons';

interface MainWeatherProps {
  weatherData: Forecast | undefined;
  localTime: string;
}

export default class MainWeather extends React.Component<MainWeatherProps> {
  render() {
    const weatherData = this.props.weatherData;
    if (weatherData?.current) {
      return (
        <Box sx={{ flexGrow: 1 }}>
          <Grid container direction="column">
            <Grid container>
              <Grid item xs>
                <h1>
                  {this.props.localTime}
                </h1>
              </Grid>
              <Grid item xs>
                <h1>
                  <WeatherIcon iconId={weatherData.current.weather[0].id} name="owm" night={isNight(weatherData)} />
                  {' '}
                  {kToC(weatherData.current.temp)}°
                </h1>
              </Grid>
            </Grid>
            <Grid container sx={{textAlign: 'left', paddingLeft: '2rem'}}>
              <Grid item xs>
                ⬆ {weatherData.daily && kToC(weatherData.daily[0].temp.max)}°
              </Grid>
              <Grid item xs>
                Feels like: {kToC(weatherData.current.feels_like)}°
              </Grid>
              <Grid item xs>
                Sunrise: {new Date(weatherData.current.sunrise).toLocaleTimeString()}
              </Grid>
            </Grid>
            <Grid container sx={{textAlign: 'left', paddingLeft: '2rem'}}>
              <Grid item xs>
                ⬇ {weatherData.daily && kToC(weatherData.daily[0].temp.min)}°
              </Grid>
              <Grid item xs>
              Humidity: {weatherData.current.humidity}%
              </Grid>
              <Grid item xs>
                Sunset: {new Date(weatherData.current.sunset).toLocaleTimeString()}
              </Grid>
            </Grid>
            <Grid container sx={{textAlign: 'left', paddingLeft: '2rem'}}>
              <Grid item xs>
                Wind Speed: {(weatherData.current.wind_speed * 3.6).toFixed(1)} km/h
              </Grid>
              <Grid item xs>
                Wind Gust: {(weatherData.current.wind_speed * 3.6).toFixed(1)} km/h
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
