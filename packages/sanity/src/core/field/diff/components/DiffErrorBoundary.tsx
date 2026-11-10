import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Card} from '@sanity/ui'
import {Component, type ReactNode} from 'react'
import {Text, Box, Flex, Icon} from 'ui5'

import {isDev} from '../../../environment'
import {type TFunction} from '../../../i18n/types'

/** @internal */
export interface DiffErrorBoundaryProps {
  children: ReactNode
  t: TFunction
}

/** @internal */
export interface DiffErrorBoundaryState {
  error?: Error
}

/** @internal */
export class DiffErrorBoundary extends Component<DiffErrorBoundaryProps, DiffErrorBoundaryState> {
  static getDerivedStateFromError(error: Error) {
    return {error}
  }

  state: DiffErrorBoundaryState = {}

  componentDidCatch(error: Error) {
    console.error('Error rendering diff component: ')
    console.error(error)
  }

  render() {
    const {t} = this.props
    const {error} = this.state

    if (!error) {
      return this.props.children
    }

    return (
      <Card padding={3} radius={2} tone="critical">
        <Flex>
          <Icon icon={ErrorOutlineIcon} size={1} tone="critical" />

          <Box paddingLeft={3}>
            <Text as="h3" size={1} weight="medium" trim={true} tone="critical">
              {t('changes.error-boundary.title')}
            </Text>

            {isDev && (
              <Box marginTop={2}>
                <Text as="p" size={1} trim={true} tone="critical">
                  {t('changes.error-boundary.developer-info')}
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </Card>
    )
  }
}
