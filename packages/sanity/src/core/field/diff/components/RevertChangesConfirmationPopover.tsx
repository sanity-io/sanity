import {Box, Flex, Stack, Text} from '@sanity/ui'
import {type ReactElement, useCallback} from 'react'

import {Button, Popover} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'

interface RevertChangesConfirmationPopoverProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  changeCount: number
  placement?: 'left' | 'top' | 'right' | 'bottom'
  children: ReactElement
}

export function RevertChangesConfirmationPopover({
  open,
  onConfirm,
  onCancel,
  changeCount,
  placement = 'left',
  children,
}: RevertChangesConfirmationPopoverProps) {
  const {t} = useTranslation()

  const handleCancel = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onCancel()
    },
    [onCancel],
  )

  const handleConfirm = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onConfirm()
    },
    [onConfirm],
  )

  return (
    <Popover
      content={
        <Stack space={3}>
          <Box paddingY={3}>
            <Text size={1}>
              {changeCount > 1
                ? t('changes.action.revert-all-description', {count: changeCount})
                : t('changes.action.revert-changes-description', {count: changeCount})}
            </Text>
          </Box>
          <Flex gap={3} justify="flex-end">
            <Button
              mode="ghost"
              onMouseDown={handleCancel}
              text={t('changes.action.revert-all-cancel')}
            />
            <Button
              tone="critical"
              onMouseDown={handleConfirm}
              text={
                changeCount > 1
                  ? t('changes.action.revert-all-confirm')
                  : t('changes.action.revert-changes-confirm-change', {count: 1})
              }
            />
          </Flex>
        </Stack>
      }
      open={open}
      padding={3}
      portal
      placement={placement}
    >
      {children}
    </Popover>
  )
}
