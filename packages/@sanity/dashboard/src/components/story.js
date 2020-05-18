import PropTypes from 'prop-types'
import React from 'react'
import widgetStyles from 'part:@sanity/dashboard/widget-styles'
import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs, number} from 'part:@sanity/storybook/addons/knobs'
import {range} from 'lodash'
import Chance from 'chance'
import DashboardLayout from './DashboardLayout'
import widgetGroupStyles from './WidgetGroup.css'

const chance = new Chance()
const para = chance.paragraph({sentences: 2})

class StoryWidget extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired
  }

  state = {
    height: 'auto',
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
      <div data-width={this.state.width || 'auto'} data-height={this.state.height || 'auto'}>
        <div className={widgetStyles.container}>
          <div className={widgetStyles.header}>
            <h2 className={widgetStyles.title}>{this.props.title}</h2>
          </div>
          <div style={{padding: '0 1rem 1rem'}}>
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
          </div>
        </div>
      </div>
    )
  }
}

storiesOf('Dashboard', module)
  .addDecorator(withKnobs)
  .add('Grid', () => {
    const widgets = range(number('widgets', 7))
    return (
      <DashboardLayout>
        <div className={widgetGroupStyles.root}>
          {widgets.map(widget => (
            <StoryWidget key={widget} title={`Widget ${widget + 1}`} />
          ))}
        </div>
      </DashboardLayout>
    )
  })
