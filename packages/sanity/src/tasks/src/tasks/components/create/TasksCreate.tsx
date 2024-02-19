import {type PortableTextBlock} from '@sanity/types'
import {Card, Flex, Stack, Text, TextInput, useToast} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'
import {getPublishedId, useEditState, useWorkspace} from 'sanity'

import {useMentionOptions} from '../../../../../structure/comments'
import {Button} from '../../../../../ui-components'
import {useTasks} from '../../context'
import {type TaskCreatePayload, type TaskDocument, type TaskTarget} from '../../types'
import {MentionUser} from '../mentionUser'
import {RemoveTask} from '../remove/RemoveTask'
import {DescriptionInput} from './DescriptionInput'
import {TargetInput} from './TargetInput'
import {WarningText} from './WarningText'

type ModeProps =
  | {
      mode: 'create'
      task?: undefined
    }
  | {
      // TODO: This will be moved to it's own view which is different from creation. This is just for bootstrapping
      mode: 'edit'
      task: TaskDocument
    }
type TasksCreateProps = ModeProps & {
  onCancel: () => void
  onCreate?: () => void
  onDelete?: () => void
}

/**
 * @internal
 */
export const TasksCreate = (props: TasksCreateProps) => {
  const {task, mode, onCancel, onCreate, onDelete} = props
  const toast = useToast()
  const {operations, activeDocument} = useTasks()
  const {dataset, projectId} = useWorkspace()

  const getTargetValue = useCallback(
    (documentType: string, documentId: string): TaskTarget => ({
      documentType: documentType,
      document: {
        _ref: getPublishedId(documentId),
        _type: 'crossDatasetReference',
        _dataset: dataset,
        _projectId: projectId,
        _weak: true,
      },
    }),
    [dataset, projectId],
  )

  const getTaskInitialValues = () => {
    if (mode === 'edit') {
      return task
    }
    const initialValues: TaskCreatePayload = {
      title: '',
      description: null,
      assignedTo: '',
      status: 'open',
      target: activeDocument
        ? getTargetValue(activeDocument.documentType, activeDocument.documentId)
        : undefined,
    }
    return initialValues
  }

  // WIP implementation, we will later use the Form to handle the creation of a task
  const [values, setValues] = useState<TaskCreatePayload>(getTaskInitialValues)

  const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const formRootRef = useRef<HTMLDivElement>(null)
  const [submitted, setSubmitted] = useState(false)
  const {draft, published} = useEditState(
    values.target?.document._ref || '_fake',
    values.target?.documentType || '_fake',
    'low',
  )
  const mentionOptions = useMentionOptions({
    documentValue: draft || published || null,
  })

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
      if (!values.title) {
        return
      }
      setCreateStatus('loading')
      if (mode === 'create') {
        await operations.create(values)
        toast.push({
          closable: true,
          status: 'success',
          title: 'Task created',
        })
      }

      if (mode === 'edit') {
        // TODO: This will be moved to it's own view which is different from creation. This is just for bootstrapping
        await operations.edit(task._id, values)
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
  }, [operations, mode, task?._id, onCreate, toast, values])

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

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({...prev, title: e.target.value}))
  }, [])
  const handleAssignedToChange = useCallback((id: string) => {
    setValues((prev) => ({...prev, assignedTo: id}))
  }, [])
  const handleDescriptionChange = useCallback((value: PortableTextBlock[]) => {
    setValues((prev) => ({...prev, description: value}))
  }, [])

  const handleTargetChange = useCallback(
    (document: {documentId: string; documentType: string} | null) => {
      if (!document) {
        setValues((prev) => ({...prev, target: undefined}))
        return
      }
      setValues((prev) => ({
        ...prev,
        target: getTargetValue(document.documentType, document.documentId),
      }))
    },
    [getTargetValue],
  )

  return (
    <Card padding={4}>
      <Stack ref={formRootRef} space={3}>
        <TextInput
          placeholder="Task title"
          autoFocus
          fontSize={1}
          onChange={handleTitleChange}
          value={values.title}
        />
        {submitted && !values.title && <WarningText>Title is required</WarningText>}

        <DescriptionInput
          onChange={handleDescriptionChange}
          mentionOptions={mentionOptions}
          value={values.description || []}
        />

        <MentionUser
          mentionOptions={{...mentionOptions, isLoading: mentionOptions.loading}}
          value={values.assignedTo}
          onChange={handleAssignedToChange}
        />
        <TargetInput onChange={handleTargetChange} value={values.target} />
        <Flex justify="flex-end" gap={4} marginTop={2}>
          {mode === 'edit' && (
            <div style={{marginRight: 'auto'}}>
              <RemoveTask id={task._id} onRemoved={handleRemoved} />
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
