import i18n from 'i18next'
import k from './../../../../i18n/keys'
import React from 'react'
import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {isDev} from '../../../environment'

/** @internal */
export interface DiffErrorBoundaryProps {
  children: React.ReactNode
}

/** @internal */
export interface DiffErrorBoundaryState {
  error?: Error
}

/** @internal */
export class DiffErrorBoundary extends React.Component<
  DiffErrorBoundaryProps,
  DiffErrorBoundaryState
> {
  static getDerivedStateFromError(error: Error) {
    return {error}
  }

  state: DiffErrorBoundaryState = {}

  // eslint-disable-next-line class-methods-use-this
  componentDidCatch(error: Error) {
    console.error('Error rendering diff component: ')
    console.error(error)
  }

  render() {
    const {error} = this.state

    if (!error) {
      return this.props.children
    }

    return (
      <Card padding={3} radius={2} tone="critical">
        <Flex>
          <Text size={1}>
            <ErrorOutlineIcon />
          </Text>

          <Box paddingLeft={3}>
            <Text as="h3" size={1} weight="medium">
              {i18n.t(k.RENDERING_THE_CHANGES_TO_THIS)}
            </Text>

            {isDev && (
              <Box marginTop={2}>
                <Text as="p" size={1}>
                  {i18n.t(k.CHECK_THE_DEVELOPER_CONSOLE_FO)}
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </Card>
    )
  }
}
