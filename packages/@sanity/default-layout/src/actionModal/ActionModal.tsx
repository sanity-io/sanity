import {LegacyLayerProvider, CreateDocumentList} from '@sanity/base/components'
import FileIcon from 'part:@sanity/base/file-icon'
import React from 'react'
import {Box, Dialog} from '@sanity/ui'

interface Props {
  actions: {icon?: React.ComponentType; key: string}[]
  onClose: () => void
}

function ActionModal(props: Props) {
  const {actions, onClose} = props

  return (
    <LegacyLayerProvider zOffset="navbarDialog">
      <Dialog
        data-testid="default-layout-global-create-dialog"
        id="default-layout-global-create-dialog"
        onClose={onClose}
        width={2}
        header="Create new document"
      >
        <Box padding={4}>
          {actions.length > 0 ? (
            <CreateDocumentList
              items={actions.map((action) => ({
                ...action,
                icon: action.icon || FileIcon,
                onClick: onClose,
              }))}
            />
          ) : (
            <h3>No initial value templates are configured.</h3>
          )}
        </Box>
      </Dialog>
    </LegacyLayerProvider>
  )
}

export default ActionModal
