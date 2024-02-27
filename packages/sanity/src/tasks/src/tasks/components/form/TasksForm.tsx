import {Box, rem} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type CurrentUser, FormBuilder, LoadingBlock, useCurrentUser} from 'sanity'
import styled from 'styled-components'

import {CommentsEnabledProvider} from '../../../../../structure/comments'
import {MentionUserProvider} from '../../context/mentionUser'
import {type FormMode, type TaskDocument} from '../../types'
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

/**
 * @internal
 */
export function TasksForm({
  documentId,
  initialValue,
  mode,
}: {
  documentId: string
  initialValue?: Partial<TaskDocument>
  mode: FormMode
}) {
  const currentUser = useCurrentUser()

  if (!currentUser) return <LoadingBlock showText title="Loading current user" />

  return (
    // This provider needs to be mounted before the AddonWorkspaceProvider.
    <MentionUserProvider>
      <AddOnWorkspaceProvider mode={mode}>
        <TasksCreateFormInner
          documentId={documentId}
          currentUser={currentUser}
          initialValue={initialValue}
        />
      </AddOnWorkspaceProvider>
    </MentionUserProvider>
  )
}
