import {Stack, Text} from '@sanity/ui'

import {Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {type useRemoveTask} from '../../hooks'
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
        <Stack space={3}>
          <Text as="p">{t('dialog.remove-task.body')}</Text>
        </Stack>
      </Dialog>
    )
  }
  return null
}
