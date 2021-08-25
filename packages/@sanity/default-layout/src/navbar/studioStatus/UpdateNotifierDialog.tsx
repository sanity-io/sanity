import React from 'react'
import {LegacyLayerProvider} from '@sanity/base/components'
import {Box, Card, Code, Dialog, Inline, Stack, Text} from '@sanity/ui'
import {TerminalIcon} from '@sanity/icons'
import {Package} from './types'
import {VersionsTable} from './VersionsTable'

declare const __DEV__: boolean

interface Props {
  onClose: () => void
  severity: string
  outdated: Package[]
}

const upperFirst = (str: string) => `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`

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
      <Stack space={5}>
        <VersionsTable headings={['Module', 'Installed', 'Latest', 'Importance']} rows={rows} />

        <Stack space={5}>
          <Text>
            To upgrade, run the <a href="https://www.sanity.io/docs/reference/cli">Sanity CLI</a>{' '}
            upgrade command in your project folder from a terminal.
          </Text>

          <Inline space={3} paddingLeft={2}>
            <Text muted>
              <TerminalIcon />
            </Text>
            <Code>sanity upgrade</Code>
          </Inline>
        </Stack>
      </Stack>
    )
  }

  renderContactDeveloper() {
    const {severity} = this.props
    return (
      <Stack space={4}>
        <Text>
          {severity === 'high' ? (
            <>
              This Studio should be updated. Please get in touch with the developers and ask them to
              upgrade it for you.
            </>
          ) : (
            <>
              This Studio has available upgrades. Consider getting in touch with the developers and
              ask them to upgrade it for you.
            </>
          )}
        </Text>

        <Card as="details" paddingTop={4} borderTop>
          <summary>Developer info</summary>
          <Box marginTop={4}>{this.renderTable()}</Box>
        </Card>
      </Stack>
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
            <Box paddingY={5} paddingX={4}>
              <Stack space={5}>
                <Text>
                  This Studio is no longer up to date{' '}
                  {severity === 'high' ? 'and should be upgraded.' : 'and can be upgraded.'}
                </Text>

                {this.renderTable()}
              </Stack>
            </Box>
          )}

          {!__DEV__ && (
            <Box paddingY={5} paddingX={4}>
              {this.renderContactDeveloper()}
            </Box>
          )}
        </Dialog>
      </LegacyLayerProvider>
    )
  }
}

export default UpdateNotifierDialog
