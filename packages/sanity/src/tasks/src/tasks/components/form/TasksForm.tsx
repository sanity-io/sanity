import {Box, rem} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {type CurrentUser, FormBuilder, LoadingBlock, useCurrentUser} from 'sanity'
import styled from 'styled-components'

import {CommentsEnabledProvider} from '../../../../../structure/comments'
import {MentionUserProvider} from '../../context/mentionUser'
import {AddOnWorkspaceProvider} from './AddOnWorkspaceProvider'
import {useTasksFormBuilder} from './useTasksFormBuilder'

const FormBuilderRoot = styled.div((props) => {
  const theme = getTheme_v2(props.theme)

  return `
    // Update spacing for the form builder
    & > [data-ui='Stack'] {
      grid-gap: ${rem(theme.space[4])};
    }
`
})

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
          <FormBuilderRoot id="wrapper">
            <FormBuilder {...formBuilderProps} />
          </FormBuilderRoot>
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
    // This provider needs to be mounted before the AddonWorkspaceProvider.
    <MentionUserProvider>
      <AddOnWorkspaceProvider>
        <TasksCreateFormInner documentId={id} currentUser={currentUser} />
      </AddOnWorkspaceProvider>
    </MentionUserProvider>
  )
}
