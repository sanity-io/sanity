import {type EditableReleaseDocument} from '@sanity/client'
import {Stack, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ChangeEvent, useCallback, useEffect, useRef, useState} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useReleaseFormOptimisticUpdating} from '../../hooks/useReleaseFormOptimisticUpdating'
import {
  descriptionTextArea,
  fontTextFamilyVar,
  fontTextLineHeightVar,
  fontTextSizeVar,
  fontTextWeightVar,
  inputFgColorVar,
  inputPlaceholderColorVar,
  titleTextArea,
} from './TitleDescriptionForm.css'

// Cap the description height and let it scroll internally past this point, so the dialog stays a
// sensible size regardless of how long the description is.
const MAX_DESCRIPTION_HEIGHT = 200

export const getIsReleaseOpen = (release: EditableReleaseDocument): boolean =>
  release.state !== 'archived' && release.state !== 'published'

function resizeTextarea(element: HTMLTextAreaElement): void {
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

/**
 * The editable title + description form for a release. Used inside the create/edit dialogs — the
 * release detail page itself is a read-only display surface (see ReleaseDetailsEditor), and routes
 * edits here through a dialog so editing is an explicit, intentional action.
 */
export function TitleDescriptionForm({
  release,
  onChange,
  disabled,
}: {
  release: EditableReleaseDocument
  onChange: (changedValue: EditableReleaseDocument) => void
  disabled?: boolean
}): React.JSX.Element {
  const isReleaseOpen = getIsReleaseOpen(release)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const [scrollHeight, setScrollHeight] = useState(46)
  const {t} = useTranslation()
  const {color, font} = useThemeV2()

  const titleVars = assignInlineVars({
    [fontTextFamilyVar]: font.text.family,
    [fontTextWeightVar]: String(font.text.weights.bold),
    [fontTextSizeVar]: `${font.text.sizes[4].fontSize}px`,
    [fontTextLineHeightVar]: `${font.text.sizes[4].lineHeight}px`,
    [inputFgColorVar]: color.input.default.enabled.fg,
    [inputPlaceholderColorVar]: color.input.default.enabled.placeholder,
  })

  const descriptionVars = assignInlineVars({
    [fontTextFamilyVar]: font.text.family,
    [fontTextWeightVar]: String(font.text.weights.regular),
    [fontTextSizeVar]: `${font.text.sizes[2].fontSize}px`,
    [fontTextLineHeightVar]: `${font.text.sizes[2].lineHeight}px`,
    [inputFgColorVar]: color.input.default.enabled.fg,
    [inputPlaceholderColorVar]: color.input.default.enabled.placeholder,
  })

  const {localData, updateLocalData, createFocusHandler, handleBlur} =
    useReleaseFormOptimisticUpdating({
      externalValue: release,
      id: release._id,
      extractData: useCallback(
        ({metadata}: EditableReleaseDocument) => ({
          title: metadata.title,
          description: metadata.description,
        }),
        [],
      ),
    })

  useEffect(() => {
    if (titleRef.current) {
      resizeTextarea(titleRef.current)
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [release.metadata.title])

  useEffect(() => {
    if (descriptionRef.current) {
      resizeTextarea(descriptionRef.current)
      setScrollHeight(descriptionRef.current.scrollHeight)
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [release.metadata.description])

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      event.preventDefault()
      const title = event.target.value
      updateLocalData({title})
      onChange({...release, metadata: {...release.metadata, title}})
      if (titleRef.current) {
        resizeTextarea(titleRef.current)
      }
    },
    [onChange, release, updateLocalData],
  )

  const handleDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      event.preventDefault()
      if (!isReleaseOpen) return

      const description = event.target.value
      updateLocalData({description})
      onChange({...release, metadata: {...release.metadata, description}})

      // Reset to 'auto' first so the textarea can shrink when text is removed
      if (descriptionRef.current) {
        resizeTextarea(descriptionRef.current)
      }

      setScrollHeight(event.currentTarget.scrollHeight)
    },
    [isReleaseOpen, onChange, release, updateLocalData],
  )

  const shouldShowDescription = isReleaseOpen || localData.description

  return (
    <Stack gap={3}>
      <textarea
        className={titleTextArea}
        style={titleVars}
        ref={titleRef}
        onChange={handleTitleChange}
        onFocus={createFocusHandler('title')}
        onBlur={handleBlur}
        value={localData.title}
        placeholder={t('release.placeholder-untitled-release')}
        data-testid="release-form-title"
        readOnly={!isReleaseOpen}
        disabled={disabled}
      />
      {shouldShowDescription && (
        <textarea
          className={descriptionTextArea}
          ref={descriptionRef}
          autoFocus={!localData.title}
          value={localData.description}
          placeholder={t('release.form.placeholder-describe-release')}
          onChange={handleDescriptionChange}
          onFocus={createFocusHandler('description')}
          onBlur={handleBlur}
          style={{
            ...descriptionVars,
            height: `${scrollHeight}px`,
            maxHeight: MAX_DESCRIPTION_HEIGHT,
            overflowY: scrollHeight > MAX_DESCRIPTION_HEIGHT ? 'auto' : 'hidden',
          }}
          data-testid="release-form-description"
          disabled={disabled}
          readOnly={!isReleaseOpen}
        />
      )}
    </Stack>
  )
}
