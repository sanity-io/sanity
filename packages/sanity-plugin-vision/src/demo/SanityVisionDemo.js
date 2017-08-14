import React, {PropTypes} from 'react'
import createClient from '@sanity/client'
import ErrorDialog from '../components/ErrorDialog'
import {getState, storeState} from '../util/localState'
import InsanityVision from '../InsanityVision'
import Header from './Header'
import {client as clientConfig} from './config'

const getClientConfig = (newConfig = {}) => ({
  ...clientConfig.client,
  projectId: newConfig.projectId || getState('projectId'),
  dataset: newConfig.dataset || getState('dataset')
})

class SanityVisionDemo extends React.PureComponent {
  constructor(props) {
    super(props)

    const firstProjectId = props.projects[0] && props.projects[0].projectId
    this.state = {projectId: getState('projectId') || firstProjectId}
    this.handleProjectChange = this.handleProjectChange.bind(this)
  }

  handleProjectChange(event) {
    event.preventDefault()
    const projectId = event.target.value
    const config = getClientConfig({projectId})
    const client = createClient(config)

    storeState('projectId', projectId)
    this.setState({projectId, client})
  }

  componentWillMount() {
    const {projectId} = this.state
    if (projectId) {
      this.setState({client: createClient(getClientConfig({projectId}))})
    }
  }

  render() {
    return (
      <div>
        <form action="#" className="pure-form">
          <Header
            projects={this.props.projects}
            selectedProjectId={this.state.projectId}
            onProjectChange={this.handleProjectChange}
          />
        </form>

        <div className="vision">
          {this.state.client && (
            // We're using key here to force a re-render on project ID change
            <InsanityVision key={this.state.projectId} client={this.state.client} />
          )}

          {!this.state.projectId && (
            <ErrorDialog
              heading="No project selected"
              error="Please select a project from the dropdown in the header"
            />
          )}
        </div>
      </div>
    )
  }
}

SanityVisionDemo.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.shape({
    projectId: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired
  }))
}

export default SanityVisionDemo
