/* eslint-disable react/no-multi-comp */
import React, {PropTypes, PureComponent} from 'react'
import addons from '@kadira/storybook-addons'
import PropTable from './PropTable'

addons.register('sanity/info', api => {
  addons.addPanel('sanity/info/panel', {
    title: 'Sanity',
    render: function render() {
      return <SanityPanel channel={addons.getChannel()} api={api} />
    }
  })
})

class SanityPanel extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {info: {}}
  }

  onSetInfo = info => {
    this.setState({info})
  }

  componentDidMount() {
    const {channel, api} = this.props

    channel.on('sanity/info/set-info', this.onSetInfo)

    this.stopListeningOnStory = api.onStory(() => {
      this.onSetInfo({})
    })
  }

  componentWillUnmount() {
    if (this.stopListeningOnStory) {
      this.stopListeningOnStory()
    }

    this.props.channel.removeListener('sanity/info/set-info', this.onSetInfo)
  }

  renderPropTables() {
    const components = this.state.info.propTypes || []
    const propTables = components.map((comp, idx) => (
      <div key={idx}>
        <h2>&quot;{comp.name}&quot; Component</h2>
        <PropTable propTypes={comp.props} />
      </div>
    ))

    if (!propTables || propTables.length === 0) {
      return null
    }

    return (
      <div>
        <h1>Prop Types</h1>
        {propTables}
      </div>
    )
  }

  render() {
    const {part} = this.state.info
    if (!part) {
      return <div>No Sanity info recorded for this component</div>
    }

    return (
      <div>
        <dl>
          <dt>Part name</dt>
          <dd>{part}</dd>
        </dl>

        {this.renderPropTables()}
      </div>
    )
  }
}

SanityPanel.propTypes = {
  channel: PropTypes.shape({
    removeListener: PropTypes.func.isRequired
  }),
  api: PropTypes.shape({
    onStory: PropTypes.func.isRequired
  })
}
