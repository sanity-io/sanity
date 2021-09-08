// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import tools from 'all:part:@sanity/base/tool'
import React from 'react'
import ErrorScreen from './ErrorScreen'

declare const __DEV__: boolean

const defaultUnknownError = {
  message: 'An unknown error occured while rendering',
}

interface Props {
  tool: string
}

// eslint-disable-next-line react/require-optimization
export default class RenderTool extends React.Component<Props> {
  static defaultProps = {
    tool: null,
  }

  state = {error: null, showErrorDetails: __DEV__}

  componentDidUpdate(prevProps, prevState) {
    const prevToolName = prevProps.tool
    const currToolName = this.props.tool

    if (prevToolName !== currToolName && prevState.error) {
      // https://reactjs.org/docs/react-component.html#componentdidupdate
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({error: null, showErrorDetails: __DEV__})
    }
  }

  componentDidCatch(error, info) {
    this.setState({error: {error, info}})
  }

  handleShowDetails = () => {
    this.setState({showErrorDetails: true})
  }

  handleRetry = () => {
    this.setState({error: null})
  }

  getActiveTool() {
    const activeToolName = this.props.tool
    const activeTool = tools.find((tool) => tool.name === activeToolName)
    return activeTool
  }

  render() {
    if (this.state.error) {
      const {error, info} = this.state.error
      const {showErrorDetails} = this.state

      return (
        <ErrorScreen
          activeTool={this.getActiveTool()}
          // Some (rare) errors doesn't seem to have any Error instance attached
          // In these cases, default to an error-like object with a generic message
          error={error || defaultUnknownError}
          info={info}
          onRetry={this.handleRetry}
          onShowDetails={this.handleShowDetails}
          showErrorDetails={showErrorDetails}
        />
      )
    }

    if (!tools.length) {
      return (
        <div>
          No tools fulfills the part <code>`part:@sanity/base/tool`</code>
        </div>
      )
    }

    const activeTool = this.getActiveTool()
    if (!activeTool) {
      return <div>Tool not found: {this.props.tool}</div>
    }

    const ActiveTool = activeTool.component
    return <ActiveTool {...this.props} />
  }
}
