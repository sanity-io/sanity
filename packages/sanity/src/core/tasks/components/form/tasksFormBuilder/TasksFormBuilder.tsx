import {type CurrentUser, type SanityDocument} from '@sanity/types'
import {Box, rem} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {motion, type Variants} from 'framer-motion'
import {useEffect, useMemo} from 'react'
import {styled} from 'styled-components'

import {LoadingBlock} from '../../../../components'
import {FormBuilder} from '../../../../form'
import {useCurrentUser} from '../../../../store'
import {useWorkspace} from '../../../../studio'
import {MentionUserProvider, useMentionUser, useTasks, useTasksNavigation} from '../../../context'
import {type TaskDocument, type TaskTarget} from '../../../types'
import {TasksAddonWorkspaceProvider} from '../addonWorkspace'
import {getTargetValue} from '../utils'
import {useTasksFormBuilder} from './useTasksFormBuilder'

const VARIANTS: Variants = {
  hidden: {opacity: 0},
  visible: {
    opacity: 1,
    transition: {duration: 0.2, delay: 0.2},
  },
}

const FormBuilderRoot = styled(motion.div)((props) => {
  const theme = getTheme_v2(props.theme)

  return `
    // Update spacing for the form builder
    & > [data-ui='Stack'] {
      grid-gap: ${rem(theme.space[4])};
    }
`
})

const TasksFormBuilderInner = ({
  documentId,
  initialValue,
}: {
  documentId: string
  currentUser: CurrentUser
  initialValue?: Partial<TaskDocument>
}) => {
  const formBuilderProps = useTasksFormBuilder({
    documentType: 'tasks.task',
    documentId,
    initialValue,
  })
  // Updates the selected document in the mention user context - to verify the user permissions.
  const {setSelectedDocument} = useMentionUser()

  const target = formBuilderProps.loading
    ? undefined
    : (formBuilderProps.value?.target as TaskTarget)

  const targetId = target?.document?._ref
  const targetType = target?.documentType

  useEffect(() => {
    const documentValue =
      targetId && targetType ? ({_id: targetId, _type: targetType} as SanityDocument) : null

    setSelectedDocument(documentValue)
  }, [targetId, targetType, setSelectedDocument])

  return (
    <Box>
      {formBuilderProps.loading ? (
        <LoadingBlock showText />
      ) : (
        <FormBuilderRoot id="wrapper" initial="hidden" animate="visible" variants={VARIANTS}>
          <FormBuilder {...formBuilderProps} />
        </FormBuilderRoot>
      )}
    </Box>
  )
}

/**
 * @internal
 */
export function TasksFormBuilder() {
  const currentUser = useCurrentUser()
  const {activeDocument} = useTasks()
  const {dataset, projectId} = useWorkspace()
  const {
    state: {selectedTask, viewMode, duplicateTaskValues},
  } = useTasksNavigation()

  const initialValue: Partial<TaskDocument> | undefined = useMemo(() => {
    if (!currentUser) return undefined
    if (!selectedTask) return undefined
    if (viewMode === 'duplicate') {
      return {
        ...duplicateTaskValues,
        title: `${duplicateTaskValues?.title} (copy)`, // Set the new task title
        createdByUser: undefined, // Remove the createdByUser field
        _id: selectedTask, // Set the new task ID
        _type: 'tasks.task',
        authorId: currentUser.id, // Set the author ID
        status: 'open',
      }
    }
    if (viewMode === 'create') {
      return {
        _id: selectedTask,
        _type: 'tasks.task',
        authorId: currentUser.id,
        status: 'open',
        subscribers: [currentUser.id],
        target: activeDocument
          ? getTargetValue({
              documentId: activeDocument.documentId,
              documentType: activeDocument.documentType,
              dataset,
              projectId,
            })
          : undefined,
      }
    }
    // For edit and draft mode, the initial value is undefined.
    return undefined
  }, [activeDocument, currentUser, dataset, duplicateTaskValues, projectId, selectedTask, viewMode])
  if (!currentUser) return <LoadingBlock showText title="Loading current user" />
  if (!selectedTask) return null

  return (
    // This provider needs to be mounted before the TasksAddonWorkspaceProvider.
    <MentionUserProvider>
      <TasksAddonWorkspaceProvider mode={viewMode === 'edit' ? 'edit' : 'create'}>
        <TasksFormBuilderInner
          documentId={selectedTask}
          currentUser={currentUser}
          initialValue={initialValue}
        />
      </TasksAddonWorkspaceProvider>
    </MentionUserProvider>
  )
}
