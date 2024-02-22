import {Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../../ui-components'
import {useTasks} from '../../context'

interface RemoveTaskProps {
  id: string
  onError?: (message: string) => void
  onRemoved?: () => void
}
export function RemoveTask(props: RemoveTaskProps) {
  const {id, onError, onRemoved} = props
  const [removeStatus, setRemoveStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [showDialog, setShowDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {operations} = useTasks()
  const handleRemove = useCallback(async () => {
    try {
      setRemoveStatus('loading')
      await operations.remove(id)
      setRemoveStatus('idle')
      setShowDialog(false)
      onRemoved?.()
    } catch (e) {
      onError?.(e.message)
      setError(e.message)
      setRemoveStatus('error')
    }
  }, [id, operations, onError, onRemoved])

  return (
    <>
      {showDialog && (
        <Dialog
          id="remove-task"
          header="Remove task"
          // eslint-disable-next-line react/jsx-no-bind
          onClose={() => setShowDialog(false)}
          footer={{
            cancelButton: {
              text: 'Cancel',
              onClick: () => setShowDialog(false),
            },
            confirmButton: {
              text: 'Remove',
              tone: 'critical',
              onClick: handleRemove,
              loading: removeStatus === 'loading',
            },
          }}
        >
          <Stack space={2}>
            <Text>Are you sure you want to remove this task?</Text>
            <Text>It can't be restored</Text>
          </Stack>
        </Dialog>
      )}
      <Button
        text="Remove"
        mode="bleed"
        tone="critical"
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => setShowDialog(true)}
        disabled={removeStatus == 'loading'}
      />
    </>
  )
}
