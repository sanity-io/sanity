import {type PortableTextBlock} from '@sanity/types'
 
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {startTransition, useCallback, useEffect, useState} from 'react'

import {CommentInput} from '../../../../../comments'
import {type ArrayFieldProps, set} from '../../../../../form'
import {useTranslation} from '../../../../../i18n'
import {useCurrentUser} from '../../../../../store'
import {useMentionUser} from '../../../../context'
import {tasksLocaleNamespace} from '../../../../i18n'
import {type FormMode} from '../../../../types'
import * as classes from './DescriptionInput.css'
import {renderBlock} from './render'

export function DescriptionInput(props: ArrayFieldProps & {mode: FormMode}) {
  const {
    value: _propValue,
    mode,
    inputProps: {onChange},
  } = props
  const value = _propValue as PortableTextBlock[] | undefined
  const currentUser = useCurrentUser()
  const {mentionOptions} = useMentionUser()
  const theme = useThemeV2()

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

  const verticalPadding = mode === 'edit' ? theme.space[1] : theme.space[3]
  const minHeight = mode === 'edit' ? 120 : 200
  const paddingValue =
    mode === 'edit'
      ? `${verticalPadding}px 0px`
      : `${verticalPadding}px ${theme.space[2]}px`
  const computedMinHeight = Math.max(textBoxScrollHeight + verticalPadding, minHeight)

  if (!currentUser) return null
  return (
    <div
      className={classes.descriptionInputRoot}
      ref={handleSetRootRef}
      style={assignInlineVars({
        [classes.paddingVar]: paddingValue,
        [classes.minHeightVar]: `${computedMinHeight}px`,
        [classes.boxShadowVar]: mode === 'edit' ? 'none' : '',
      })}
    >
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
    </div>
  )
}
