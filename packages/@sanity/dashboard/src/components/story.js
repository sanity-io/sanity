/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DashboardGrid from './DashboardGrid'
import WidgetWrapper from './WidgetWrapper'
import {withKnobs, number} from 'part:@sanity/storybook/addons/knobs'
import {range} from 'lodash'
import Chance from 'chance'

const chance = new Chance()
const para = chance.paragraph({sentences: 2})

class StoryWidget extends React.Component {
  state = {
    width: 'auto'
  }

  handleWidthChange = event => {
    this.setState({width: event.target.value})
  }

  handleHeightChange = event => {
    this.setState({height: event.target.value})
  }

  render() {
    return (
      <WidgetWrapper {...this.state}>
        <h1>{this.props.title}</h1>
        <p>{para}</p>
        <div style={{dispay: 'flex'}}>
          <label>Width</label>
          <select onChange={this.handleWidthChange}>
            <option>auto</option>
            <option>small</option>
            <option>medium</option>
            <option>large</option>
            <option>full</option>
          </select>
        </div>

        <div style={{dispay: 'flex'}}>
          <label>Height</label>
          <select onChange={this.handleHeightChange}>
            <option>auto</option>
            <option>small</option>
            <option>medium</option>
            <option>large</option>
            <option>full</option>
          </select>
        </div>
      </WidgetWrapper>
    )
  }
}

storiesOf('Dashboard')
  .addDecorator(withKnobs)
  .add('Grid', () => {
    const widgets = range(number('widgets', 7))
    return (
      <DashboardGrid>
        {widgets.map(widget => (
          <StoryWidget key={widget} title={widget + 1} />
        ))}
      </DashboardGrid>
    )
  })
