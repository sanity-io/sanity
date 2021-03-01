import React from 'react'
import {Subscription} from 'rxjs'
import {loadGoogleMapsApi, GoogleLoadState} from './loadGoogleMapsApi'
import {LoadError} from './LoadError'

interface LoadProps {
  children: (api: typeof window.google.maps) => React.ReactElement
}

export class GoogleMapsLoadProxy extends React.Component<LoadProps, GoogleLoadState> {
  loadSubscription: Subscription | undefined

  constructor(props: LoadProps) {
    super(props)

    this.state = {loadState: 'loading'}

    let sync = true
    this.loadSubscription = loadGoogleMapsApi().subscribe((loadState) => {
      if (sync) {
        this.state = loadState
      } else {
        this.setState(loadState)
      }
    })
    sync = false
  }

  componentWillUnmount() {
    if (this.loadSubscription) {
      this.loadSubscription.unsubscribe()
    }
  }

  render() {
    switch (this.state.loadState) {
      case 'loadError':
        return <LoadError error={this.state.error} isAuthError={false} />
      case 'authError':
        return <LoadError isAuthError />
      case 'loading':
        return <div>Loading Google Maps API</div>
      case 'loaded':
        return this.props.children(this.state.api) || null
      default:
        return null
    }
  }
}
