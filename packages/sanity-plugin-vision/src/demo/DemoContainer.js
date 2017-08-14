import React from 'react'
import createClient from '@sanity/client'
import DelayedSpinner from '../components/DelayedSpinner'
import ErrorDialog from '../components/ErrorDialog'
import SanityVisionDemo from './SanityVisionDemo'
import config from './config'

class DemoContainer extends React.PureComponent {
  constructor() {
    super()
    this.state = {}
  }

  componentDidMount() {
    const cfg = {...config.client, useProjectHostname: false}
    const client = createClient(cfg)
    client.observable.request({uri: '/projects'}).subscribe({
      next: projects => this.setState({projects}),
      error: error => this.setState({error})
    })
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorDialog
          heading="An error occured while loading projects"
          error={this.state.error}
        />
      )
    }

    if (!this.state.projects) {
      return <DelayedSpinner />
    }

    return <SanityVisionDemo projects={this.state.projects} />
  }
}

export default DemoContainer
