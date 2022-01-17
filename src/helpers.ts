import { Forecast } from 'owm-onecall-api';

export function kToC(temp: number): string {
  return (temp - 273.15).toFixed(1);
}

export function isNight(weatherData: Forecast): boolean {
  if (weatherData.current && (weatherData?.current.dt > weatherData?.current.sunset)) {
    return true;
  }
  return false;
}

export function mieleToTimeLeft(hours: number, minutes: number): string {
  console.log(`Minutes ${minutes}`);
  if (hours > 0) {
    const addTime = Date.now() + (60 * 60 * hours * 1000) + (60 * minutes * 1000);
    return new Date(addTime).toLocaleTimeString([], { timeStyle: 'short' });
  }
  return `${minutes} minutes`;
}
