import {type PortableTextBlock} from '@sanity/types'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {startTransition, useCallback, useEffect, useState} from 'react'
import {css, styled} from 'styled-components'

import {CommentInput} from '../../../../../comments'
import {type ArrayFieldProps, set} from '../../../../../form'
import {useTranslation} from '../../../../../i18n'
import {useCurrentUser} from '../../../../../store'
import {useMentionUser} from '../../../../context'
import {tasksLocaleNamespace} from '../../../../i18n'
import {type FormMode} from '../../../../types'
import {renderBlock} from './render'

const DescriptionInputRoot = styled.div<{$mode: FormMode; $minHeight: number}>((props) => {
  const theme = getTheme_v2(props.theme)
  const verticalPadding = props.$mode === 'edit' ? theme.space[1] : theme.space[3]
  const minHeight = props.$mode === 'edit' ? 120 : 200
  return css`
    /* select CommentInputEditableWrap and change the padding */
    [data-ui='CommentInputEditableWrap'] {
      overflow: hidden;
      padding: ${props.$mode === 'edit'
        ? `${verticalPadding}px 0px`
        : `${verticalPadding}px ${theme.space[2]}px`};
      min-height: ${Math.max(props.$minHeight + verticalPadding, minHeight)}px !important;
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

  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null)
  const [textBoxScrollHeight, setTextBoxScrollHeight] = useState<number>(200)
  const setTextboxHeight = useCallback((ref: HTMLDivElement) => {
    const textBox = ref.querySelector('[role="textbox"]')
    if (!textBox) return

    const height = textBox.scrollHeight
    setTextBoxScrollHeight(height)
  }, [])

  const handleSetRootRef = useCallback((ref: HTMLDivElement) => {
    if (!ref) return
    startTransition(() => {
      setRootRef(ref)
    })
  }, [])

  const {t} = useTranslation(tasksLocaleNamespace)

  useEffect(() => {
    if (!rootRef) return
    setTextboxHeight(rootRef)
  }, [value, setTextboxHeight, rootRef])

  if (!currentUser) return null
  return (
    <DescriptionInputRoot $mode={mode} ref={handleSetRootRef} $minHeight={textBoxScrollHeight}>
      <CommentInput
        expandOnFocus={false}
        currentUser={currentUser}
        mentionOptions={mentionOptions}
        onChange={handleChange}
        value={value ?? []}
        withAvatar={false}
        placeholder={t('form.input.description.placeholder')}
        // eslint-disable-next-line react/jsx-no-bind
        onDiscardConfirm={() => null}
        renderBlock={renderBlock}
      />
    </DescriptionInputRoot>
  )
}
