interface ApplianceStatus {
  on: Boolean;
  timeRemaining?: number;
  status?: string;
}

export default class HomeConnect {
  // const clientId = '6B52A678C8DA1A6AADC3CE658FE183FBC92A9FB1F3188D6C3B529297D1F50D01';

  getStatus = (): ApplianceStatus => {
    return {
      on: false,
    }

  }
}
