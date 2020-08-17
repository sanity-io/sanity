import React from 'react'
import {loadGoogleMapsApi} from './loadGoogleMapsApi'

interface LoadProps {
  children: (api: typeof window.google.maps) => React.ReactElement
}

interface LoadState {
  loading: boolean
  error?: Error
  api?: typeof window.google.maps
}

export class GoogleMapsLoadProxy extends React.Component<LoadProps, LoadState> {
  constructor(props: LoadProps) {
    super(props)

    const api =
      typeof window !== 'undefined' && window.google && window.google.maps
        ? window.google.maps
        : undefined

    this.state = {loading: !api, api}
  }

  componentDidMount() {
    if (this.state.api) {
      // Already loaded
      return
    }

    loadGoogleMapsApi()
      .then(api => this.setState({loading: false, api}))
      .catch(error => this.setState({error}))
  }

  render() {
    const {error, loading, api} = this.state
    if (error) {
      return <div>Load error: {error.stack}</div>
    }

    if (loading) {
      return <div>Loading Google Maps API</div>
    }

    if (api) {
      return this.props.children(api) || null
    }

    return null
  }
}
