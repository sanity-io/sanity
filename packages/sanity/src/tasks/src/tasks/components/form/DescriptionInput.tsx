// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type PortableTextBlock, useCurrentUser, type UserListWithPermissionsHookValue} from 'sanity'
import styled from 'styled-components'

// TODO: This is using components from structure/comments which is not ideal. But given comments is changing
// we won't refactor this now, until comments is stable and we implement in this the `FormBuilder`
import {CommentInput} from '../../../../../structure/comments'

interface DescriptionInputProps {
  mentionOptions: UserListWithPermissionsHookValue
  value: PortableTextBlock[]
  onChange: (value: PortableTextBlock[]) => void
}

const DescriptionInputRoot = styled.div((props) => {
  const theme = getTheme_v2(props.theme)
  return `
    /* select editable-wrap and change the padding */
    #editable-wrap {
        padding: ${theme.space[3]}px ${theme.space[2]}px;
    }
    `
})

export function DescriptionInput(props: DescriptionInputProps) {
  const {mentionOptions, value, onChange} = props
  const currentUser = useCurrentUser()

  if (!currentUser) return null
  return (
    <DescriptionInputRoot>
      <CommentInput
        currentUser={currentUser}
        mentionOptions={mentionOptions}
        onChange={onChange}
        value={value}
        withAvatar={false}
        placeholder="Task description"
      />
    </DescriptionInputRoot>
  )
}
