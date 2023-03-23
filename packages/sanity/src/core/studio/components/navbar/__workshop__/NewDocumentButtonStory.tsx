import {Card, Flex} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import {NewDocumentButton, useNewDocumentOptions} from '../new-document'
import type {ModalType} from '../new-document/types'

const MODAL_OPTIONS: Record<string, ModalType> = {
  popover: 'popover',
  dialog: 'dialog',
}

export default function NewDocumentButtonStory() {
  const {options, loading, canCreateDocument} = useNewDocumentOptions()

  const modal = useSelect('Modal', MODAL_OPTIONS, 'popover') || 'popover'
  const customLoading = useBoolean('Loading', false, 'Props') || false
  const noItems = useBoolean('No items', false, 'Props') || false
  const noPermission = useBoolean('No permission', false, 'Props') || false
  const withNoPermissionOptions = useBoolean('With no permission options', false, 'Props') || false

  const customItems = useMemo(() => {
    if (!withNoPermissionOptions) return options

    return options.map((item, index) => ({
      ...item,
      hasPermission: index % 2 === 0,
    }))
  }, [options, withNoPermissionOptions])

  return (
    <Card padding={2} borderBottom>
      <Flex>
        <NewDocumentButton
          canCreateDocument={noPermission ? false : canCreateDocument}
          loading={customLoading || loading}
          modal={modal}
          options={noItems ? [] : customItems}
        />
      </Flex>
    </Card>
  )
}
