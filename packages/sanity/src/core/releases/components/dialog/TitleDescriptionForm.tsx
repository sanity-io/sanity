import {type EditableReleaseDocument} from '@sanity/client'
import {Stack,useTheme_v2 as useThemeV2} from '@sanity/ui'
 
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useReleaseFormOptimisticUpdating} from '../../hooks/useReleaseFormOptimisticUpdating'
import {
  descFontSizeVar,
  descFontWeightVar,
  descLineHeightVar,
  descriptionTextArea,
  fgColorVar,
  fontFamilyVar,
  placeholderColorVar,
  titleFontSizeVar,
  titleFontWeightVar,
  titleLineHeightVar,
  titleMinHeightVar,
  titleTextArea,
} from './TitleDescriptionForm.css'

const MAX_DESCRIPTION_HEIGHT = 200

export const getIsReleaseOpen = (release: EditableReleaseDocument): boolean =>
  release.state !== 'archived' && release.state !== 'published'

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
  const titleRef = useRef<HTMLTextAreaElement | null>(null)
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const [scrollHeight, setScrollHeight] = useState(46)
  const {t} = useTranslation()
  const theme = useThemeV2()

  const themeVars = useMemo(() => assignInlineVars({
    [fontFamilyVar]: theme.font.text.family,
    [titleFontWeightVar]: String(theme.font.text.weights.bold),
    [titleFontSizeVar]: `${theme.font.text.sizes[4].fontSize}px`,
    [titleLineHeightVar]: `${theme.font.text.sizes[4].lineHeight}px`,
    [titleMinHeightVar]: `${theme.font.text.sizes[4].lineHeight}px`,
    [fgColorVar]: theme.color.input.default.enabled.fg,
    [placeholderColorVar]: theme.color.input.default.enabled.placeholder,
    [descFontWeightVar]: String(theme.font.text.weights.regular),
    [descFontSizeVar]: `${theme.font.text.sizes[2].fontSize}px`,
    [descLineHeightVar]: `${theme.font.text.sizes[2].lineHeight}px`,
  }), [theme])

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
    // make sure that the text area for the description has the right height initially
    if (descriptionRef.current) {
      setScrollHeight(descriptionRef.current.scrollHeight)
    }
    // Auto-resize title textarea
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [])

  useEffect(() => {
    // Auto-resize title textarea when value changes
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [release.metadata.title])

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      event.preventDefault()
      const title = event.target.value
      // save the values to make input snappier while requests happen in the background
      updateLocalData({title})
      onChange({...release, metadata: {...release.metadata, title}})

      // Auto-resize the textarea
      if (titleRef.current) {
        titleRef.current.style.height = 'auto'
        titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
      }
    },
    [onChange, release, updateLocalData],
  )

  const handleDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      event.preventDefault()
      if (!isReleaseOpen) return

      const description = event.target.value
      // save the values to make input snappier while requests happen in the background
      updateLocalData({description})
      onChange({...release, metadata: {...release.metadata, description}})

      /** we must reset the height in order to make sure that if the text area shrinks,
       * that the actual input will change height as well */
      if (descriptionRef.current) {
        descriptionRef.current.style.overflow = 'hidden'
        descriptionRef.current.style.height = 'auto'
        descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`

        if (parseInt(descriptionRef.current.style.height, 10) > MAX_DESCRIPTION_HEIGHT) {
          descriptionRef.current.style.overflow = 'auto'
        }
      }

      setScrollHeight(event.currentTarget.scrollHeight)
    },
    [isReleaseOpen, onChange, release, updateLocalData],
  )

  const shouldShowDescription = isReleaseOpen || localData.description

  return (
    <Stack space={3}>
      <textarea
        className={titleTextArea}
        style={themeVars}
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
          style={{
            ...themeVars,
            height: `${scrollHeight}px`,
            maxHeight: MAX_DESCRIPTION_HEIGHT,
          }}
          ref={descriptionRef}
          autoFocus={!localData.title}
          value={localData.description}
          placeholder={t('release.form.placeholder-describe-release')}
          onChange={handleDescriptionChange}
          onFocus={createFocusHandler('description')}
          onBlur={handleBlur}
          data-testid="release-form-description"
          disabled={disabled}
          readOnly={!isReleaseOpen}
        />
      )}
    </Stack>
  )
}
