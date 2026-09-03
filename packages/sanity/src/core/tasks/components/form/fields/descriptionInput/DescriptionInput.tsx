import {type PortableTextBlock} from '@sanity/types'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {startTransition, useCallback, useEffect, useState} from 'react'

import {CommentInput} from '../../../../../comments/components/pte/comment-input/CommentInput'
import {set} from '../../../../../form/patch/patch'
import {type ArrayFieldProps} from '../../../../../form/types/fieldProps'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {useCurrentUser} from '../../../../../store/user/hooks'
import {useMentionUser} from '../../../../context/mentionUser/useMentionUser'
import {tasksLocaleNamespace} from '../../../../i18n'
import {type FormMode} from '../../../../types'
import {
  descriptionInputRoot,
  descriptionInputRootEdit,
  editableWrapMinHeightVar,
  editableWrapPaddingVar,
} from './DescriptionInput.css'
import {renderBlock} from './render/renderBlock'

export function DescriptionInput(props: ArrayFieldProps & {mode: FormMode}) {
  const {
    value: _propValue,
    mode,
    inputProps: {onChange},
  } = props
  const value = _propValue as PortableTextBlock[] | undefined
  const currentUser = useCurrentUser()
  const {mentionOptions} = useMentionUser()
  const {space} = useThemeV2()

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
    // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
    setTextboxHeight(rootRef)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [value, setTextboxHeight, rootRef])

  if (!currentUser) return null

  const verticalPadding = mode === 'edit' ? space[1] : space[3]
  const minHeight = mode === 'edit' ? 120 : 200

  return (
    <div
      className={clsx(descriptionInputRoot, mode === 'edit' && descriptionInputRootEdit)}
      ref={handleSetRootRef}
      style={assignInlineVars({
        [editableWrapPaddingVar]:
          mode === 'edit' ? `${verticalPadding}px 0px` : `${verticalPadding}px ${space[2]}px`,
        [editableWrapMinHeightVar]: `${Math.max(textBoxScrollHeight + verticalPadding, minHeight)}px`,
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
