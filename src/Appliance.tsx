import React from 'react';
import './Appliance.css';

export interface Appliance {
  icon: string;
  on: boolean;
  name: string;
  timeRemaining?: string;
  program?: string;
}

interface ApplianceProps {
  appliance: Appliance;
  hideOff: boolean;
}

export default class ApplianceView extends React.Component<ApplianceProps> {
  render() {
    let appliance = this.props.appliance;
    let hideOff = this.props.hideOff;
    return (
      <div className='status'>
        <div className='iconContainer'>
          <img src={`/${appliance.icon}`} alt={appliance.icon} className='icon' />
        </div>
        <div>{appliance.name}</div>
        <div>
          {appliance.program && (
            <>
              <div>
                {appliance.program}
              </div>
              <div>
                {appliance.timeRemaining}
              </div>
            </>
          )}
          {(!appliance.on && !hideOff) && (
            <>
              Off
            </>
          )}
        </div>
      </div>
    )
  };
}
