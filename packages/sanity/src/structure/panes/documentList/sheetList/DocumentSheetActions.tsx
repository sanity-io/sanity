import {blue, gray, white} from '@sanity/color'
import {CloseIcon, PublishIcon} from '@sanity/icons'
import {Box, Card, Flex, Popover, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {catchError, of} from 'rxjs'
import {
  isValidationErrorMarker,
  type ObjectSchemaType,
  useClient,
  useTranslation,
  useValidationStatusList,
  type ValidationStatus,
} from 'sanity'
import {css, styled} from 'styled-components'

import {Button} from '../../../../ui-components'
import {batchPublish} from './batchPublish'
import {type DocumentSheetListTable, type DocumentSheetTableRow} from './types'

interface DocumentSheetActionsProps {
  table: DocumentSheetListTable
  schemaType: ObjectSchemaType
}

function BatchPublishAction({
  schemaType,
  items,
  validationStatus,
}: {
  schemaType: ObjectSchemaType
  items: DocumentSheetTableRow['__metadata'][]
  validationStatus: (ValidationStatus & {
    publishedDocId: string
  })[]
}) {
  const {t} = useTranslation()
  const [publishStatus, setPublishStatus] = useState('idle')
  const hasErrorStatus = validationStatus.some((item) =>
    item.validation.some(isValidationErrorMarker),
  )
  const isValidating = validationStatus.some((item) => item.isValidating)

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
      title: t('sheet-list.actions.toast.publishing-pending-title'),
      description: t('sheet-list.actions.toast.publishing-pending-description', {
        itemPlural: `item${items.length > 1 ? 's' : ''}`,
      }),
    })
    action
      .execute()
      .pipe(
        catchError((err) => {
          setPublishStatus('idle')
          toast.push({
            closable: true,
            id: 'publishing-toast',
            status: 'error',
            title: t('sheet-list.actions.toast.publishing-failed-description'),
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
            title: t('sheet-list.actions.toast.publishing-success-title'),
            description: t('sheet-list.actions.toast.publishing-success-description'),
          })
        }
      })
  }, [action, items.length, t, toast])
  const actionDisabled = action.disabled()

  const disabled =
    publishStatus !== 'idle' || Boolean(actionDisabled) || hasErrorStatus || isValidating

  return (
    <Box>
      <Button
        tone="primary"
        tooltipProps={{
          disabled: !disabled,
          content: hasErrorStatus ? (
            <Text>{t('sheet-list.validation-error.tooltip')}</Text>
          ) : (
            actionDisabled && (
              <Stack space={2}>
                {actionDisabled.map((reason) => (
                  <Text key={reason.id}>
                    {t('sheet-list.validation-error.reason', {id: reason.id})}{' '}
                    <strong>{reason.reason}</strong>
                  </Text>
                ))}
              </Stack>
            )
          ),
        }}
        loading={publishStatus === 'publishing'}
        icon={PublishIcon}
        text={t('sheet-list.actions.publish-all-label')}
        onClick={handlePublish}
        disabled={disabled}
      />
    </Box>
  )
}

const ActionsRoot = styled(Card)(() => {
  return css`
    background-color: ${blue[700].hex};
    --card-fg-color: ${white.hex};
  `
})

const CloseButton = styled(Button)`
  background: transparent;
  :hover {
    background: ${gray[200].hex};
  }
  --card-fg-color: ${white.hex};
  --card-icon-color: ${white.hex};
`

const Divider = styled(Box)(() => {
  return css`
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    height: 1px;
  `
})

const PopoverPlaceholder = styled.div`
  position: sticky;
  margin-left: auto;
  margin-right: auto;
  bottom: 0;
  width: 80%;
`

export function DocumentSheetActions({table, schemaType}: DocumentSheetActionsProps) {
  const selectedRows = table.getSelectedRowModel().rows
  const items = useMemo(() => selectedRows.map((row) => row.original.__metadata), [selectedRows])
  const itemsId = useMemo(() => items.map((item) => item.idPair.publishedId), [items])
  const validationStatus = useValidationStatusList(itemsId, schemaType.name)
  const {t} = useTranslation()

  return (
    <Popover
      open={selectedRows.length > 0}
      portal
      animate
      radius={5}
      placement="bottom"
      matchReferenceWidth
      content={
        <ActionsRoot radius={5} paddingX={4} paddingY={3} scheme="light">
          <Stack>
            <Flex align="center" justify="space-between">
              <Text size={1} weight="medium">
                {t('sheet-list.actions.selected-count-label', {
                  count: items.length,
                  itemPlural: `item${items.length > 1 ? 's' : ''}`,
                })}
              </Text>
              <CloseButton
                mode="bleed"
                tone="default"
                iconRight={CloseIcon}
                text={t('sheet-list.actions.unselect-all-label')}
                onClick={() => table.setRowSelection({})}
              />
            </Flex>

            <Divider marginBottom={3} marginY={1} />
            <BatchPublishAction
              schemaType={schemaType}
              items={items}
              validationStatus={validationStatus}
            />
          </Stack>
        </ActionsRoot>
      }
    >
      <PopoverPlaceholder />
    </Popover>
  )
}
