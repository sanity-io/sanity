// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback, useEffect, useRef, useState} from 'react'
import {
  type ArrayFieldProps,
  type ArrayOfObjectsInputProps,
  type PortableTextBlock,
  set,
  useCurrentUser,
} from 'sanity'
import styled, {css} from 'styled-components'

// TODO: This is using components from structure/comments which is not ideal. But given comments is changing
// we won't refactor this now, until comments is stable and we implement in this the `FormBuilder`
import {CommentInput} from '../../../../../structure/comments'
import {useMentionUser} from '../../context'
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

const DescriptionInputRoot = styled.div<{$mode: FormMode; $minHeight: number}>((props) => {
  const theme = getTheme_v2(props.theme)
  const verticalPadding = props.$mode === 'edit' ? theme.space[1] : theme.space[3]
  return css`
    /* select editable-wrap and change the padding */
    [data-ui='editable-wrap'] {
      overflow: hidden;
      padding: ${props.$mode === 'edit'
        ? `${verticalPadding}px 0px`
        : `${verticalPadding}px ${theme.space[2]}px`};
      min-height: ${Math.max(props.$minHeight + verticalPadding, 100)}px;
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

  const rootRef = useRef<HTMLDivElement | null>(null)
  const [textBoxScrollHeight, setTextBoxScrollHeight] = useState<number>(0)
  const setTextboxHeight = useCallback((ref: HTMLDivElement) => {
    const textBox = ref.querySelector('[role="textbox"]')
    if (!textBox) return
    const height = textBox.scrollHeight
    setTextBoxScrollHeight(height)
  }, [])

  const setRootRef = useCallback(
    (ref: HTMLDivElement) => {
      if (!ref) return
      setTextboxHeight(ref)
      rootRef.current = ref
    },
    [setTextboxHeight],
  )

  useEffect(() => {
    if (!rootRef.current) return
    setTextboxHeight(rootRef.current)
  }, [value, setTextboxHeight])

  if (!currentUser) return null
  return (
    <DescriptionInputRoot $mode={mode} ref={setRootRef} $minHeight={textBoxScrollHeight || 100}>
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
