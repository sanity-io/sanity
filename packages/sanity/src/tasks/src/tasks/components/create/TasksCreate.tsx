import {useCallback, useEffect, useRef, useState} from 'react'
import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {PortableTextBlock} from '@sanity/types'
import {Button} from '../../../../../ui-components'
import {useTasks} from '../../context'
import {CommentInput, useMentionOptions} from '../../../../../structure/comments'
import {useCurrentUser} from '../../../../../core'
import {WarningText} from './WarningText'

interface TasksCreateProps {
  onCancel: () => void
}
export const TasksCreate = (props: TasksCreateProps) => {
  const {onCancel} = props
  const {operations} = useTasks()
  // WIP implementation, we will later use the Form to handle the creation of a task
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState<PortableTextBlock[]>([])
  const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const formRootRef = useRef<HTMLDivElement>(null)
  const [submitted, setSubmitted] = useState(false)
  const currentUser = useCurrentUser()

  const handleSubmit = useCallback(async () => {
    try {
      setSubmitted(true)
      if (!title || !description?.[0]) {
        return
      }
      setCreateStatus('loading')
      const created = await operations.create({title, status: 'open', description})
      // eslint-disable-next-line no-console
      console.log('It is created', created)
      setTitle('')
      setDescription([])
      setCreateStatus('idle')
    } catch (err) {
      setCreateStatus('error')
      setError(err.message)
    }
  }, [title, operations, description])

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
          {submitted && !description?.[0] && <WarningText>Description is required</WarningText>}
        </Box>

        <Flex justify="flex-end" gap={4} marginTop={4}>
          <Button
            text="Cancel"
            mode="bleed"
            onClick={onCancel}
            disabled={createStatus === 'loading'}
          />
          <Button text="Create" mode="ghost" tone="primary" loading={createStatus === 'loading'} />
        </Flex>
      </Stack>

      {createStatus === 'error' && (
        <Card tone="critical" padding={2} marginTop={4} border radius={2}>
          <Stack space={3}>
            <Text size={0} weight="semibold">
              Failed to create task
            </Text>
            <Text size={0}>{error}</Text>
          </Stack>
        </Card>
      )}
    </Card>
  )
}
