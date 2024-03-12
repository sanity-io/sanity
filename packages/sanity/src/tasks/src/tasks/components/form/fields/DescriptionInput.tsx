// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback, useEffect, useRef, useState} from 'react'
import {type ArrayFieldProps, type PortableTextBlock, set, useCurrentUser} from 'sanity'
import styled, {css} from 'styled-components'

import {CommentInput} from '../../../../../../structure/comments'
import {useMentionUser} from '../../../context'
import {type FormMode} from '../../../types'

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
      min-height: ${Math.max(props.$minHeight + verticalPadding, 200)}px !important;
    }
    #comment-input-root {
      box-shadow: ${props.$mode === 'edit' ? 'none' : ''};
    }
    [data-ui='CommentInputActions'] {
      display: none !important;
    }
  `
})

export function DescriptionInput(props: ArrayFieldProps & {mode: FormMode}) {
  const {
    value: _propValue,
    mode,
    inputProps: {onChange},
  } = props
  const value = _propValue as PortableTextBlock[] | undefined

  const currentUser = useCurrentUser()
  const {mentionOptions} = useMentionUser()

  const handleChange = useCallback((next: PortableTextBlock[]) => onChange(set(next)), [onChange])

  const rootRef = useRef<HTMLDivElement | null>(null)
  const [textBoxScrollHeight, setTextBoxScrollHeight] = useState<number>(200)
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
    <DescriptionInputRoot $mode={mode} ref={setRootRef} $minHeight={textBoxScrollHeight || 200}>
      <CommentInput
        expandOnFocus={false}
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
