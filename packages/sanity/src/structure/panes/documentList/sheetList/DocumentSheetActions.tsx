/* eslint-disable i18next/no-literal-string */
/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable @sanity/i18n/no-attribute-template-literals */
import {PublishIcon, SpinnerIcon} from '@sanity/icons'
import {Flex, Menu, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {catchError, of} from 'rxjs'
import {ContextMenuButton, type ObjectSchemaType, useClient} from 'sanity'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {batchPublish} from './batchPublish'
import {type DocumentSheetListTable, type DocumentSheetTableRow} from './types'

interface DocumentSheetActionsProps {
  table: DocumentSheetListTable
  schemaType: ObjectSchemaType
}

function BatchPublishAction({
  schemaType,
  items,
}: {
  schemaType: ObjectSchemaType
  items: DocumentSheetTableRow['__metadata'][]
}) {
  const [publishStatus, setPublishStatus] = useState('idle')
  const client = useClient()
  const toast = useToast()
  const action = useMemo(
    () => batchPublish({schemaType, client, items}),
    [schemaType, client, items],
  )

  const handlePublish = useCallback(() => {
    setPublishStatus('publishing')
    toast.push({
      closable: true,
      duration: 60000,
      id: 'publishing-toast',
      status: 'info',
      title: 'Publishing',
      description: 'Publishing documents...',
    })
    action
      .execute()
      .pipe(
        catchError((err) => {
          setPublishStatus('error')
          toast.push({
            closable: true,
            id: 'publishing-toast',
            status: 'error',
            title: 'An error occurred',
            description: err.message,
          })
          return of(null)
        }),
      )
      .subscribe((response) => {
        if (response) {
          setPublishStatus('idle')
          toast.push({
            closable: true,
            id: 'publishing-toast',
            status: 'success',
            title: 'Published',
            description: 'The documents have been published',
          })
        }
      })
  }, [action, toast])
  const actionDisabled = action.disabled()

  const disabled = Boolean(items.length == 0 || publishStatus !== 'idle' || actionDisabled)

  return (
    <MenuItem
      tooltipProps={{
        disabled: items.length > 0 && !actionDisabled,
        content:
          items.length === 0
            ? 'Select one or more documents to publish'
            : actionDisabled && (
                <Stack space={2}>
                  {actionDisabled.map((reason) => (
                    <Text key={reason.id}>
                      Item with ID {reason.id} cannot be published: <strong>{reason.reason}</strong>
                    </Text>
                  ))}
                </Stack>
              ),
      }}
      icon={publishStatus === 'publishing' ? SpinnerIcon : PublishIcon}
      text={
        items.length > 0
          ? `Publish ${items.length} document${items.length > 1 ? 's' : ''}`
          : 'Publish'
      }
      onClick={handlePublish}
      disabled={disabled}
    />
  )
}

export function DocumentSheetActions({table, schemaType}: DocumentSheetActionsProps) {
  const selectedRows = table.getSelectedRowModel().rows
  const items = useMemo(() => selectedRows.map((row) => row.original.__metadata), [selectedRows])

  return (
    <Flex>
      <MenuButton
        id="document-sheet-actions"
        button={<ContextMenuButton />}
        menu={
          <Menu>
            <BatchPublishAction schemaType={schemaType} items={items} />
          </Menu>
        }
      />
    </Flex>
  )
}
