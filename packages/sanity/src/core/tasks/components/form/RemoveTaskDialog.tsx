import {Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type useRemoveTask} from '../../hooks/useRemoveTask'
import {tasksLocaleNamespace} from '../../i18n'

export function RemoveTaskDialog(props: ReturnType<typeof useRemoveTask>) {
  const {handleCloseDialog, handleRemove, removeStatus, showDialog} = props
  const {t} = useTranslation(tasksLocaleNamespace)
  if (showDialog) {
    return (
      <Dialog
        id="remove-task"
        header={t('dialog.remove-task.title')}
        onClose={handleCloseDialog}
        footer={{
          cancelButton: {
            text: t('dialog.remove-task.buttons.cancel.text'),
            onClick: handleCloseDialog,
          },
          confirmButton: {
            text: t('dialog.remove-task.buttons.confirm.text'),
            tone: 'critical',
            onClick: handleRemove,
            loading: removeStatus === 'loading',
          },
        }}
      >
        <VStack gap={3}>
          <Text as="p">{t('dialog.remove-task.body')}</Text>
        </VStack>
      </Dialog>
    )
  }
  return null
}
