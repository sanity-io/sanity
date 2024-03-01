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
        // eslint-disable-next-line react/jsx-no-bind
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
          <Text as="p">Are you sure you want to remove this task?</Text>
          <Text as="p">It can't be restored</Text>
        </Stack>
      </Dialog>
    )
  }
  return null
}
