import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { DailyDataBlock } from 'owm-onecall-api';
import { kToC } from './helpers';
import 'weather-react-icons/lib/css/weather-icons.css';
import { WeatherIcon } from 'weather-react-icons';

interface MiniWeatherProps {
  weatherData: DailyDataBlock;
}
export default class MainWeather extends React.Component<MiniWeatherProps> {
  render() {
    const weatherData = this.props.weatherData;
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Grid container direction="column">
          <Grid container>
            <Grid item xs>
              <h3>
                <WeatherIcon iconId={weatherData.weather[0].id} name="owm" />
                {' '}
                {new Date(weatherData.sunrise * 1000).toLocaleString([], {weekday: 'long'})}
                {' '}
                ⬆ {kToC(weatherData.temp.max)}°
                {' '}
                ⬇ {kToC(weatherData.temp.min)}°
              </h3>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  }
};
