import React, {PureComponent} from 'react'
import Snackbar from 'part:@sanity/components/snackbar/default'
import Spinner from 'part:@sanity/components/loading/spinner'

const eventBus = window.__webpack_hot_middleware_eventbus__
const events = eventBus ? eventBus.eventTypes : {}

const STATE_CONNECTING = 0
const STATE_OPEN = 1
const STATE_CLOSED = 2

class DevServerStatus extends PureComponent {
  constructor(...args) {
    super(...args)
    this.enabled = __DEV__ && eventBus
    this.state = {
      connectionState: STATE_CONNECTING,
      hasHadConnection: false,
      buildState: events.EVENT_UP_TO_DATE,
      reloadRequired: false,
    }
  }

  componentDidMount() {
    if (!this.enabled) {
      return
    }

    this.hmrUnsubscribe = eventBus.subscribe(this.handleEvent)
  }

  componentWillUnmount() {
    if (this.hmrUnsubscribe) {
      this.hmrUnsubscribe()
    }
  }

  handleEvent = (evt) => {
    switch (evt.type) {
      case events.EVENT_DISCONNECTED:
        return this.setState({connectionState: STATE_CLOSED})
      case events.EVENT_CONNECTING:
        return this.setState({connectionState: STATE_CONNECTING})
      case events.EVENT_CONNECTED:
        return this.handleConnected()
      case events.EVENT_BUILT:
      case events.EVENT_BUILDING:
      case events.EVENT_UP_TO_DATE:
        return this.setState(({reloadRequired: reloadWasRequired}) => ({
          buildState: evt.type,
          reloadRequired: reloadWasRequired || evt.requiresReload || false,
        }))
      default:
        if (evt.requiresReload && !this.state.reloadRequired) {
          this.setState({buildState: events.EVENT_BUILT, reloadRequired: true})
        }
    }

    return null
  }

  handleConnected = () => {
    this.setState({connectionState: STATE_OPEN})

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

  renderBuildStatus() {
    const {reloadRequired, buildState} = this.state
    if (reloadRequired) {
      return (
        <Snackbar
          id="__dev-server-status"
          kind="warning"
          isPersisted
          isCloseable={false}
          title={<strong>Reload required!</strong>}
          subtitle={<div>To see your latest changes, you need to reload the browser window.</div>}
          action={{title: 'Reload', callback: () => window.location.reload()}}
          allowDuplicateSnackbarType
        />
      )
    }

    if (buildState === events.EVENT_BUILDING) {
      return (
        <Snackbar
          id="__dev-server-status"
          kind="warning"
          isPersisted
          isCloseable={false}
          title={<Spinner delay={0} inline message="Rebuilding bundle…" />}
          allowDuplicateSnackbarType
        />
      )
    }

    return null
  }

  render() {
    // We're in production or missing the HMR event bus
    if (!this.enabled) {
      return null
    }

    const {connectionState, hasHadConnection} = this.state
    const isDisconnected = connectionState === STATE_CONNECTING || connectionState === STATE_CLOSED

    // We are disconnected
    if (isDisconnected && hasHadConnection) {
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
          allowDuplicateSnackbarType
        />
      )
    }

    // We're still trying to connect for the first time
    if (!hasHadConnection) {
      return null
    }

    // We're connected, show build status if we have anything worthwhile
    return this.renderBuildStatus()
  }
}

export default DevServerStatus
