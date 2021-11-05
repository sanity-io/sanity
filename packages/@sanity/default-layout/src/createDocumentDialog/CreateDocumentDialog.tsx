// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {memo} from 'react'
import {Box, Dialog, Text} from '@sanity/ui'
import {CreateDocumentList, LegacyLayerProvider} from '@sanity/base/components'
import {NewDocumentOption} from '@sanity/base/_internal'
import {DocumentIcon} from '@sanity/icons'

interface CreateDocumentDialogProps {
  newDocumentOptions: NewDocumentOption[]
  onClose: () => void
}

export const CreateDocumentDialog = memo(function CreateDocumentDialog(
  props: CreateDocumentDialogProps
) {
  const {newDocumentOptions, onClose} = props

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
          {newDocumentOptions.length > 0 ? (
            <CreateDocumentList
              items={newDocumentOptions.map((option) => ({
                key: option.key,
                ...option.preview,
                icon: option.preview.icon || <DocumentIcon />,
                onClick: onClose,
                params: option.intent.params[0],
                templateParams: option.item.parameters,
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
