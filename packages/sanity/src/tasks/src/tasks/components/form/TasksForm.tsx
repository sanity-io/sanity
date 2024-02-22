import {Box} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {type CurrentUser, FormBuilder, LoadingBlock, useCurrentUser} from 'sanity'

import {CommentsEnabledProvider} from '../../../../../structure/comments'
import {AddOnWorkspaceProvider} from './AddOnWorkspaceProvider'
import {useTasksFormBuilder} from './useTasksFormBuilder'

const TasksCreateFormInner = ({
  documentId,
  currentUser,
}: {
  documentId: string
  currentUser: CurrentUser
}) => {
  const formBuilderProps = useTasksFormBuilder({
    documentType: 'tasks.task',
    documentId,
    currentUserId: currentUser.id,
  })

  return (
    <CommentsEnabledProvider documentId="" documentType="">
      <Box paddingX={4}>
        {formBuilderProps.loading ? (
          <LoadingBlock showText />
        ) : (
          <FormBuilder {...formBuilderProps} />
        )}
      </Box>
    </CommentsEnabledProvider>
  )
}

export function TasksForm({documentId}: {documentId?: string}) {
  // In create mode, we need to generate a new document ID - WIP - creation will work different, it will create the new document after click on "create"
  const id = useMemo(() => documentId || uuid(), [documentId])
  const currentUser = useCurrentUser()
  if (!currentUser) return <LoadingBlock showText title="Loading current user" />
  return (
    <AddOnWorkspaceProvider>
      <TasksCreateFormInner documentId={id} currentUser={currentUser} />
    </AddOnWorkspaceProvider>
  )
}
