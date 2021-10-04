// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {memo} from 'react'
import {Box, Dialog, Text} from '@sanity/ui'
import {LegacyLayerProvider} from '@sanity/base/components'
import {DocumentIcon} from '@sanity/icons'
import CreateDocumentList from 'part:@sanity/components/lists/create-document'

interface CreateDocumentDialogProps {
  actions: {icon?: React.ComponentType; key: string}[]
  onClose: () => void
}

export const CreateDocumentDialog = memo(function CreateDocumentDialog(
  props: CreateDocumentDialogProps
) {
  const {actions, onClose} = props

  return (
    <LegacyLayerProvider zOffset="navbarDialog">
      <Dialog
        data-testid="default-layout-global-create-dialog"
        id="create-document-dialog"
        onClickOutside={onClose}
        onClose={onClose}
        width={2}
        header="Create new document"
      >
        <Box padding={3}>
          {actions.length > 0 ? (
            <CreateDocumentList
              items={actions.map((action) => ({
                ...action,
                icon: action.icon || <DocumentIcon />,
                onClick: onClose,
              }))}
            />
          ) : (
            <Box paddingY={5}>
              <Text weight="semibold" align="center">
                No initial value templates are configured.
              </Text>
            </Box>
          )}
        </Box>
      </Dialog>
    </LegacyLayerProvider>
  )
})
