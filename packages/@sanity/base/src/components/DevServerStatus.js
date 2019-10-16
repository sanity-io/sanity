import React, {PureComponent} from 'react'
import polyfilledEventSource from '@sanity/eventsource'
import Snackbar from 'part:@sanity/components/snackbar/default'

const isWindowEventSource = Boolean(typeof window !== 'undefined' && window.EventSource)
const EventSource = isWindowEventSource
  ? window.EventSource // Native browser EventSource
  : polyfilledEventSource // Node.js, IE, Edge etc

const STATE_CONNECTING = 0
const STATE_OPEN = 1
const STATE_CLOSED = 2

class DevServerStatus extends PureComponent {
  constructor(...args) {
    super(...args)
    this.enabled = __DEV__ && EventSource
    this.state = {
      connectionState: STATE_CONNECTING,
      hasHadConnection: false
    }
  }

  componentDidMount() {
    if (!this.enabled) {
      return
    }

    this.es = new EventSource('/__webpack_hmr')
    this.es.onerror = this.handleReadyChange
    this.es.onopen = this.handleOpen
  }

  componentWillUnmount() {
    if (this.es) {
      this.es.close()
    }
  }

  handleOpen = () => {
    this.handleReadyChange()

    if (this.state.hasHadConnection) {
      // We reconnected after being disconnected.
      // Hot-reloading won't be applied automatically.
      // We should consider showing a message telling the user to reload,
      // or just programatically reload the page:
      window.location.reload()
    } else {
      this.setState({hasHadConnection: true})
    }
  }

  handleReadyChange = () => {
    this.setState({connectionState: this.es.readyState})
  }

  render() {
    // We're in production, or eventsource is not supported by the browser (Edge)
    if (!this.enabled) {
      return null
    }

    // We're connected, don't show anything
    if (this.state.connectionState === STATE_OPEN) {
      return null
    }

    // We are disconnected
    if (this.state.hasHadConnection) {
      return (
        <Snackbar
          id="__dev-server-status"
          kind="warning"
          isPersisted
          isCloseable={false}
          title={<strong>Disconnected from the dev server!</strong>}
          subtitle={
            <div>
              To see your latest changes, restart the Studio with <code>sanity start</code> in your
              project folder.
            </div>
          }
        />
      )
    }
    return null
  }
}

export default DevServerStatus
