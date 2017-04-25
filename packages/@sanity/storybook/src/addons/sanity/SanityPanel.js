import PropTypes from 'prop-types'
/* eslint-disable react/no-multi-comp */
import React from 'react'
import addons from '@kadira/storybook-addons'
import PropTable from './PropTable'
import styles from './styles/SanityPanel.css'

addons.register('sanity/info', api => {
  addons.addPanel('sanity/info/panel', {
    title: 'Sanity',
    render: function render() {
      return <SanityPanel channel={addons.getChannel()} api={api} />
    }
  })
})

class SanityPanel extends React.PureComponent {
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
      <span key={idx}>
        <h1 className={styles.header}>
          Proptypes for <code className={styles.code}>&lt;{comp.name} /&gt;</code>
        </h1>
        <PropTable propTypes={comp.props} />
      </span>
    ))

    if (!propTables || propTables.length === 0) {
      return null
    }

    return (
      <div>
        {propTables}
      </div>
    )
  }

  normalizePath(path) {
    const basePath = this.state.info.basePath
    const normalized = path.indexOf(basePath) === 0
      ? path.slice(basePath.length)
      : path

    return normalized.replace(/(^\/|\/$)/g, '')
  }

  render() {
    const {part, definition, implementations} = this.state.info
    const def = definition || {}
    if (!part) {
      return <div className={styles.noContent}>No Sanity info recorded for this component</div>
    }

    return (
      <div className={styles.root}>
        <section className={styles.section}>
          <h1 className={styles.header}>Part Info</h1>
          <dl>
            <dt className={styles.title}>Part name</dt>
            <dd>{part}</dd>

            <dt className={styles.title}>Description</dt>
            <dd>{def.description || '<no description provided>'}</dd>

            <dt className={styles.title}>Defined by</dt>
            <dd>{def.plugin} <span className={styles.light}>({this.normalizePath(def.path)})</span></dd>

            <dt className={styles.title}>Implemented by</dt>
            <dd>
              <ul>
                {(implementations || []).reverse().map(impl => (
                  <li key={impl.path}>
                    {impl.plugin} <span className={styles.light}>({this.normalizePath(impl.path)})</span>
                  </li>
                ))}
              </ul>
            </dd>
          </dl>
        </section>
        <section className={styles.section}>
          {this.renderPropTables()}
        </section>
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
