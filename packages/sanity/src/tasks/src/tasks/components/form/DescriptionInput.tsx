// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback} from 'react'
import {type ArrayOfObjectsInputProps, type PortableTextBlock, set, useCurrentUser} from 'sanity'
import {useMentionUser} from 'sanity/tasks'
import styled from 'styled-components'

// TODO: This is using components from structure/comments which is not ideal. But given comments is changing
// we won't refactor this now, until comments is stable and we implement in this the `FormBuilder`
import {CommentInput} from '../../../../../structure/comments'

const DescriptionInputRoot = styled.div((props) => {
  const theme = getTheme_v2(props.theme)
  return `
    /* select editable-wrap and change the padding */
    #editable-wrap {
        padding: ${theme.space[3]}px ${theme.space[2]}px;
        min-height: 100px;
    }
    `
})

export function DescriptionInput(props: ArrayOfObjectsInputProps<PortableTextBlock>) {
  const {value, onChange} = props
  const currentUser = useCurrentUser()
  const {mentionOptions} = useMentionUser()

  const handleChange = useCallback((next: PortableTextBlock[]) => onChange(set(next)), [onChange])

  if (!currentUser) return null
  return (
    <DescriptionInputRoot>
      <CommentInput
        currentUser={currentUser}
        mentionOptions={mentionOptions}
        onChange={handleChange}
        value={value ?? []}
        withAvatar={false}
        placeholder="Optional additional description"
        // eslint-disable-next-line react/jsx-no-bind
        onDiscardConfirm={() => null}
      />
    </DescriptionInputRoot>
  )
}
