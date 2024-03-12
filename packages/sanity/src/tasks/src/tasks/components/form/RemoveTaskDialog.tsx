import {Stack, Text} from '@sanity/ui'

import {Dialog} from '../../../../../ui-components'
import {type useRemoveTask} from '../../hooks/useRemoveTask'

export function RemoveTaskDialog(props: ReturnType<typeof useRemoveTask>) {
  const {handleCloseDialog, handleRemove, removeStatus, showDialog} = props
  if (showDialog) {
    return (
      <Dialog
        id="remove-task"
        header="Remove task"
        onClose={handleCloseDialog}
        footer={{
          cancelButton: {
            text: 'Cancel',
            onClick: handleCloseDialog,
          },
          confirmButton: {
            text: 'Remove',
            tone: 'critical',
            onClick: handleRemove,
            loading: removeStatus === 'loading',
          },
        }}
      >
        <Stack space={3}>
          <Text as="p">Are you sure you want to delete this task?</Text>
          <Text as="p">Once deleted, it cannot be restored.</Text>
        </Stack>
      </Dialog>
    )
  }
  return null
}
