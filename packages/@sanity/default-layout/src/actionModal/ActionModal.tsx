// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {LegacyLayerProvider} from '@sanity/base/components'
import FileIcon from 'part:@sanity/base/file-icon'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import CreateDocumentList from 'part:@sanity/components/lists/create-document'
import React from 'react'

interface Props {
  actions: {icon?: React.ComponentType; key: string}[]
  onClose: () => void
}

function ActionModal(props: Props) {
  const {actions, onClose} = props

  return (
    <LegacyLayerProvider zOffset="navbarDialog">
      <DefaultDialog
        data-testid="default-layout-global-create-dialog"
        onClickOutside={onClose}
        onClose={onClose}
        size="large"
        title="Create new document"
      >
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
      </DefaultDialog>
    </LegacyLayerProvider>
  )
}

export default ActionModal
