// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import {Box, Card, Container, Heading, Stack, Text} from '@sanity/ui'
import tools from 'all:part:@sanity/base/tool'
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
          showErrorDetails={showErrorDetails}
        />
      )
    }

    if (!tools.length) {
      return (
        <Card height="fill" paddingX={[5, 5, 7]} paddingY={[5, 5, 6]} sizing="border">
          <Container>
            <Box marginBottom={5}>
              <Heading as="h1">No available tools</Heading>
            </Box>

            <Stack space={4}>
              <Text muted>
                No tools implement the <code>part:@sanity/base/tool</code>, so there is nothing to
                display.
              </Text>
            </Stack>
          </Container>
        </Card>
      )
    }

    const activeTool = this.getActiveTool()
    if (!activeTool) {
      return (
        <Card height="fill" paddingX={[5, 5, 7]} paddingY={[5, 5, 6]} sizing="border">
          <Container>
            <Box marginBottom={5}>
              <Heading as="h1">
                Tool not found: <code>{this.props.tool}</code>
              </Heading>
            </Box>

            <Stack space={4}>
              <Text muted>
                The list of tools installed in this Studio does not include{' '}
                <code>{this.props.tool}</code>
              </Text>
            </Stack>
          </Container>
        </Card>
      )
    }

    const ActiveTool = activeTool.component
    return <ActiveTool {...this.props} />
  }
}
