// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback} from 'react'
import {
  type ArrayFieldProps,
  type ArrayOfObjectsInputProps,
  type PortableTextBlock,
  set,
  useCurrentUser,
} from 'sanity'
import {useMentionUser} from 'sanity/tasks'
import styled, {css} from 'styled-components'

// TODO: This is using components from structure/comments which is not ideal. But given comments is changing
// we won't refactor this now, until comments is stable and we implement in this the `FormBuilder`
import {CommentInput} from '../../../../../structure/comments'
import {type FormMode} from '../../types'

const RemoveTitle = styled.div`
  margin-top: 12px;
  fieldset {
    // Tag first div of fieldset
    & > div:first-child {
      display: none !important;
    }
  }
`
export const DescriptionFieldContainer = (props: ArrayFieldProps) => {
  return <RemoveTitle>{props.renderDefault(props)}</RemoveTitle>
}

const DescriptionInputRoot = styled.div<{$mode: FormMode}>((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    /* select editable-wrap and change the padding */
    #editable-wrap {
      padding: ${props.$mode === 'edit'
        ? `${theme.space[1]}px 0px`
        : `${theme.space[3]}px ${theme.space[2]}px`};
      min-height: 100px;
    }
    #comment-input-root {
      box-shadow: ${props.$mode === 'edit' ? 'none' : ''};
    }
    [data-ui='CommentInputActions'] {
      display: none !important;
    }
  `
})

export function DescriptionInput(
  props: ArrayOfObjectsInputProps<PortableTextBlock> & {mode: FormMode},
) {
  const {value, onChange, mode} = props
  const currentUser = useCurrentUser()
  const {mentionOptions} = useMentionUser()

  const handleChange = useCallback((next: PortableTextBlock[]) => onChange(set(next)), [onChange])

  if (!currentUser) return null
  return (
    <DescriptionInputRoot $mode={mode}>
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
