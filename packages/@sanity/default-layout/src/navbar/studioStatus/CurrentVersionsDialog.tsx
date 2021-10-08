import React from 'react'
import {LegacyLayerProvider} from '@sanity/base/components'
import {Stack, Box, Card, Text, Dialog} from '@sanity/ui'
import {VersionsTable} from './VersionsTable'

interface Props {
  onClose: () => void
  versions: {[key: string]: string}
}

class CurrentVersionsDialog extends React.PureComponent<Props> {
  static defaultProps = {
    versions: [],
  }

  renderTable() {
    const {versions} = this.props

    const rows = Object.keys(versions).map((pkgName) => {
      return {
        name: pkgName,
        items: [versions[pkgName], versions[pkgName]],
      }
    })

    return <VersionsTable headings={['Module', 'Installed', 'Latest']} rows={rows} />
  }

  render() {
    const {onClose} = this.props

    return (
      <LegacyLayerProvider zOffset="navbarDialog">
        <Dialog
          header="The Studio is up to date"
          id="current-versions-dialog"
          onClose={onClose}
          onClickOutside={onClose}
          width={1}
          scheme="light"
        >
          <Box padding={4}>
            <Stack space={5}>
              <Text>This Studio was built using the latest versions of all packages.</Text>
              <Card as="details" paddingTop={4} borderTop>
                <summary>List all installed packages</summary>
                <Box marginTop={4}>{this.renderTable()}</Box>
              </Card>
            </Stack>
          </Box>
        </Dialog>
      </LegacyLayerProvider>
    )
  }
}

export default CurrentVersionsDialog
