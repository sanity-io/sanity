import {LegacyLayerProvider} from '@sanity/base/components'
import {InfoOutlineIcon, ToggleArrowRightIcon} from '@sanity/icons'
import {Box, Card, Code, Dialog, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import type {Package} from './types'
import {VersionsTable} from './VersionsTable'

declare const __DEV__: boolean

interface Props {
  onClose: () => void
  severity: string
  outdated: Package[]
}

const upperFirst = (str: string) => `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`

const ShellCode = styled(Code).attrs({language: 'shell'})`
  & > code:before {
    content: '$ ';
  }
`

const ToggleDetailsIcon = styled(ToggleArrowRightIcon)`
  transition: transform 150ms;

  details[open] & {
    transform: rotate(90deg);
  }
`

class UpdateNotifierDialog extends React.PureComponent<Props> {
  static defaultProps = {
    outdated: [],
  }

  renderTable() {
    const {outdated} = this.props

    const rows = outdated.map((pkg) => {
      return {
        name: pkg.name,
        items: [pkg.version, pkg.latest, upperFirst(pkg.severity || 'low')],
      }
    })

    return (
      <Stack space={4}>
        <VersionsTable headings={['Module', 'Installed', 'Latest', 'Importance']} rows={rows} />

        <Card padding={4} radius={2} tone="primary">
          <Flex>
            <Text size={1}>
              <InfoOutlineIcon />
            </Text>
            <Box flex={1} marginLeft={3}>
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  How to upgrade?
                </Text>
                <Text size={1}>
                  Run the{' '}
                  <a
                    href="https://www.sanity.io/docs/reference/cli"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Sanity CLI
                  </a>{' '}
                  upgrade command in the Terminal of your project directory:
                </Text>
              </Stack>
              <Box marginTop={4}>
                <ShellCode>sanity upgrade</ShellCode>
              </Box>
            </Box>
          </Flex>
        </Card>
      </Stack>
    )
  }

  renderContactDeveloper() {
    const {severity} = this.props

    return (
      <>
        <Box padding={4}>
          <Text>
            {severity === 'high' ? (
              <>
                This Studio should be updated. Please get in touch with the developers and ask them
                to upgrade it for you.
              </>
            ) : (
              <>
                This Studio has available upgrades. Consider getting in touch with the developers
                and ask them to upgrade it for you.
              </>
            )}
          </Text>
        </Box>

        <Card as="details" borderTop padding={4}>
          <Flex as="summary">
            <Text>
              <ToggleDetailsIcon />
            </Text>
            <Box flex={1} marginLeft={2}>
              <Text weight="semibold">Developer info</Text>
            </Box>
          </Flex>
          <Box marginTop={4}>{this.renderTable()}</Box>
        </Card>
      </>
    )
  }

  render() {
    const {severity, onClose} = this.props

    return (
      <LegacyLayerProvider zOffset="navbarDialog">
        <Dialog
          header={severity === 'low' ? 'Upgrades available' : 'Studio is outdated'}
          onClose={onClose}
          onClickOutside={onClose}
          id="update-notifier-dialog"
          width={1}
          scheme="light"
        >
          {__DEV__ && (
            <Box padding={4}>
              <Stack space={5}>
                <Text>
                  This Studio is no longer up to date{' '}
                  {severity === 'high' ? 'and should be upgraded.' : 'and can be upgraded.'}
                </Text>

                {this.renderTable()}
              </Stack>
            </Box>
          )}

          {!__DEV__ && this.renderContactDeveloper()}
        </Dialog>
      </LegacyLayerProvider>
    )
  }
}

export default UpdateNotifierDialog
