/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DashboardGrid from './DashboardGrid'
import WidgetWrapper from './WidgetWrapper'
import {withKnobs, number} from 'part:@sanity/storybook/addons/knobs'
import {range} from 'lodash'

class StoryWidget extends React.Component {
  state = {
    width: 'full'
  }

  handleWidthChange = event => {
    console.log('change', event)
  }

  render() {
    return (
      <WidgetWrapper {...this.state}>
        <label>Width</label>
        <select onChange={this.handleWidthChange}>
          <option>auto</option>
          <option>small</option>
          <option>medium</option>
          <option>large</option>
        </select>
      </WidgetWrapper>
    )
  }
}

storiesOf('Dashboard')
  .addDecorator(withKnobs)
  .add('Grid', () => {
    const widgets = range(number('widgets', 5))
    return (
      <DashboardGrid>
        {widgets.map(widget => (
          <StoryWidget key={widget} />
        ))}
      </DashboardGrid>
    )
  })
