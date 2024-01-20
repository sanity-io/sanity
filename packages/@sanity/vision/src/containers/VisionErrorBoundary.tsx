/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {Button, Card, Code, Container, Heading, Stack} from '@sanity/ui'
import {Component, type PropsWithChildren} from 'react'

import {clearLocalStorage} from '../util/localStorage'

/**
 * @internal
 */
export type VisionErrorBoundaryProps = PropsWithChildren

/**
 * @internal
 */
interface VisionErrorBoundaryState {
  error: string | null
  numRetries: number
}

/**
 * @internal
 */
export class VisionErrorBoundary extends Component<
  VisionErrorBoundaryProps,
  VisionErrorBoundaryState
> {
  constructor(props: VisionErrorBoundaryProps) {
    super(props)
    this.state = {error: null, numRetries: 0}
  }

  static getDerivedStateFromError(error: unknown) {
    return {error: error instanceof Error ? error.message : `${error}`}
  }

  handleRetryRender = () =>
    this.setState((prev) => ({error: null, numRetries: prev.numRetries + 1}))

  handleRetryWithCacheClear = () => {
    clearLocalStorage()
    this.handleRetryRender()
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    const message = this.state.error
    const withCacheClear = this.state.numRetries > 0

    return (
      <Card
        height="fill"
        overflow="auto"
        paddingY={[4, 5, 6, 7]}
        paddingX={4}
        sizing="border"
        tone="critical"
      >
        <Container width={3}>
          <Stack space={4}>
            <div>
              <Button
                onClick={withCacheClear ? this.handleRetryWithCacheClear : this.handleRetryRender}
                text={withCacheClear ? 'Clear cache and retry' : 'Retry'}
                tone="default"
              />
            </div>

            <Heading>An error occured</Heading>

            <Card border radius={2} overflow="auto" padding={4} tone="inherit">
              <Stack space={4}>
                {message && (
                  <Code size={1}>
                    <strong>Error: {message}</strong>
                  </Code>
                )}
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Card>
    )
  }
}
