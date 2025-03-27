import {type PortableTextBlock} from '@sanity/types'
import {vars} from '@sanity/ui/css'
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
  const verticalPadding = props.$mode === 'edit' ? vars.space[1] : vars.space[3]
  const minHeight = props.$mode === 'edit' ? 120 : 200
  return css`
    /* select CommentInputEditableWrap and change the padding */
    [data-ui='CommentInputEditableWrap'] {
      overflow: hidden;
      padding: ${props.$mode === 'edit'
        ? `${verticalPadding} 0px`
        : `${verticalPadding} ${vars.space[2]}`};
      min-width: max(calc(${props.$minHeight}px + ${verticalPadding}), ${minHeight}px);
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
        onDiscardConfirm={() => null}
        renderBlock={renderBlock}
      />
    </DescriptionInputRoot>
  )
}
