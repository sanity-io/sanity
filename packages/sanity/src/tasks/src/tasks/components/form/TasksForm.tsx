import {Box, rem} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useEffect} from 'react'
import {
  type CurrentUser,
  FormBuilder,
  LoadingBlock,
  type SanityDocument,
  useCurrentUser,
} from 'sanity'
import styled from 'styled-components'

import {CommentsEnabledProvider} from '../../../../../structure/comments'
import {MentionUserProvider, useMentionUser} from '../../context/mentionUser'
import {type FormMode, type TaskDocument, type TaskTarget} from '../../types'
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
  // Updates the selected document in the mention user context - to verify the user permissions.
  const {setSelectedDocument} = useMentionUser()

  const target = formBuilderProps.loading
    ? undefined
    : (formBuilderProps.value?.target as TaskTarget)

  const targetId = target?.document?._ref
  const targetType = target?.documentType

  useEffect(() => {
    const documentValue =
      targetId && targetType
        ? // Hack to force the SanityDocument type, we only need to send the _id and _type in this object.
          ({_id: targetId, _type: targetType} as unknown as SanityDocument)
        : null

    setSelectedDocument(documentValue)
  }, [targetId, targetType, setSelectedDocument])

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
