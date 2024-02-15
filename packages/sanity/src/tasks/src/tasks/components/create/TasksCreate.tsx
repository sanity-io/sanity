import {type PortableTextBlock} from '@sanity/types'
import {Box, Card, Flex, Stack, Text, TextInput, useToast} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'
import {useCurrentUser} from 'sanity'

import {CommentInput, useMentionOptions} from '../../../../../structure/comments'
import {Button} from '../../../../../ui-components'
import {useTasks} from '../../context'
import {type TaskDocument} from '../../types'
import {RemoveTask} from '../remove/RemoveTask'
import {WarningText} from './WarningText'

type ModeProps =
  | {
      mode: 'create'
      initialValues?: undefined
    }
  | {
      // TODO: This will be moved to it's own view which is different from creation. This is just for bootstrapping
      mode: 'edit'
      initialValues: TaskDocument
    }
type TasksCreateProps = ModeProps & {
  onCancel: () => void
  onCreate?: () => void
  onDelete?: () => void
}
export const TasksCreate = (props: TasksCreateProps) => {
  const {initialValues, mode, onCancel, onCreate, onDelete} = props
  const {operations} = useTasks()
  // WIP implementation, we will later use the Form to handle the creation of a task
  const [title, setTitle] = useState(initialValues?.title || '')
  const [description, setDescription] = useState<PortableTextBlock[]>(
    initialValues?.description || [],
  )
  const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const formRootRef = useRef<HTMLDivElement>(null)
  const [submitted, setSubmitted] = useState(false)
  const currentUser = useCurrentUser()
  const toast = useToast()
  const handleRemoved = useCallback(async () => {
    toast.push({
      closable: true,
      status: 'success',
      title: 'Task removed',
    })
    onDelete?.()
  }, [toast, onDelete])

  const handleSubmit = useCallback(async () => {
    try {
      setSubmitted(true)
      if (!title) {
        return
      }
      setCreateStatus('loading')
      if (mode === 'create') {
        const created = await operations.create({title, status: 'open', description})
        // eslint-disable-next-line no-console
        console.log('It is created', created)
        toast.push({
          closable: true,
          status: 'success',
          title: 'Task created',
        })
      }

      if (mode === 'edit') {
        // TODO: This will be moved to it's own view which is different from creation. This is just for bootstrapping
        const updated = await operations.edit(initialValues._id, {
          title,
          description,
        })
        // eslint-disable-next-line no-console
        console.log('It is updated', updated)
        toast.push({
          closable: true,
          status: 'success',
          title: 'Changes saved',
        })
      }
      setCreateStatus('idle')
      onCreate?.()
    } catch (err) {
      setCreateStatus('error')
      setError(err.message)
    }
  }, [title, operations, description, mode, initialValues?._id, onCreate, toast])

  const submitListener = useCallback(
    (e: KeyboardEvent) => {
      if (!(e.key == 'Enter' && e.metaKey)) return
      handleSubmit()
    },
    [handleSubmit],
  )

  useEffect(() => {
    const form = formRootRef.current
    if (form) {
      form.addEventListener('keydown', submitListener)
    }
    return () => {
      if (form) {
        form.removeEventListener('keydown', submitListener)
      }
    }
  }, [formRootRef, submitListener])

  const mentionOptions = useMentionOptions({documentValue: null})
  if (!currentUser) return null
  return (
    <Card padding={4}>
      <Stack ref={formRootRef}>
        <TextInput
          placeholder="Enter task title"
          autoFocus
          fontSize={1}
          // eslint-disable-next-line react/jsx-no-bind
          onChange={(e) => setTitle(e.currentTarget.value)}
          value={title}
        />
        {submitted && !title && <WarningText>Title is required</WarningText>}

        <Box marginTop={3}>
          <CommentInput
            currentUser={currentUser}
            mentionOptions={mentionOptions}
            onChange={(val) => setDescription(val)}
            value={description}
            withAvatar={false}
            placeholder="Task description"
          />
        </Box>

        <Flex justify="flex-end" gap={4} marginTop={4}>
          {mode === 'edit' && (
            <div style={{marginRight: 'auto'}}>
              <RemoveTask id={initialValues._id} onRemoved={handleRemoved} />
            </div>
          )}
          <Button
            text="Cancel"
            mode="bleed"
            onClick={onCancel}
            disabled={createStatus === 'loading'}
          />
          <Button
            text={mode === 'create' ? 'Create' : 'Save changes'}
            mode="ghost"
            tone="primary"
            loading={createStatus === 'loading'}
            onClick={handleSubmit}
          />
        </Flex>
      </Stack>

      {createStatus === 'error' && (
        <Card tone="critical" padding={2} marginTop={4} border radius={2}>
          <Stack space={3}>
            <Text size={0} weight="semibold">
              {mode === 'create' ? 'Failed to create task' : 'Failed to update task'}
            </Text>
            <Text size={0}>{error}</Text>
          </Stack>
        </Card>
      )}
    </Card>
  )
}
