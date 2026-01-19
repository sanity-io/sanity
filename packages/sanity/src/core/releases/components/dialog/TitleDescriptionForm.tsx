import {type EditableReleaseDocument} from '@sanity/client'
import {type PortableTextBlock} from '@sanity/types'
import {Stack} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ChangeEvent, useCallback} from 'react'
import {css, styled} from 'styled-components'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useReleaseFormOptimisticUpdating} from '../../hooks/useReleaseFormOptimisticUpdating'
import {ReleaseDescriptionInput} from '../input/ReleaseDescriptionInput'

const TitleInput = styled.input((props) => {
  const {color, font} = getTheme_v2(props.theme)
  return css`
    resize: none;
    overflow: hidden;
    appearance: none;
    background: none;
    border: 0;
    padding: 0;
    border-radius: 0;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: ${font.text.family};
    font-weight: ${font.text.weights.bold};
    font-size: ${font.text.sizes[4].fontSize}px;
    line-height: ${font.text.sizes[4].lineHeight}px;
    margin: 0;
    position: relative;
    z-index: 1;
    display: block;
    transition: height 500ms;
    /* NOTE: This is a hack to disable Chrome’s autofill styles */
    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
      -webkit-text-fill-color: var(--input-fg-color) !important;
      transition: background-color 5000s;
      transition-delay: 86400s /* 24h */;
    }

    color: ${color.input.default.enabled.fg};

    &::placeholder {
      color: ${color.input.default.enabled.placeholder};
    }
  `
})


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
  const {t} = useTranslation()

  const {localData, updateLocalData, createFocusHandler, handleBlur} =
    useReleaseFormOptimisticUpdating({
      externalValue: release,
      id: release._id,
      extractData: useCallback(
        ({metadata}: EditableReleaseDocument) => ({
          title: metadata.title,
          description: metadata.description || '',
        }),
        [],
      ),
    })

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault()
      const title = event.target.value
      // save the values to make input snappier while requests happen in the background
      updateLocalData({title})
      onChange({...release, metadata: {...release.metadata, title}})
    },
    [onChange, release, updateLocalData],
  )

  const handleDescriptionChange = useCallback(
    (pteValue: PortableTextBlock[]) => {
      if (!isReleaseOpen) return

      // Save the values to make input snappier while requests happen in the background
      updateLocalData({description: pteValue})
      onChange({
        ...release,
        metadata: {
          ...release.metadata,
          description: pteValue,
        },
      })
    },
    [isReleaseOpen, onChange, release, updateLocalData],
  )

  const shouldShowDescription = isReleaseOpen || localData.description

  return (
    <Stack space={3}>
      <TitleInput
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
        <ReleaseDescriptionInput
          value={localData.description}
          onChange={handleDescriptionChange}
          onFocus={createFocusHandler('description')}
          onBlur={handleBlur}
          placeholder={t('release.form.placeholder-describe-release')}
          autoFocus={!localData.title}
          disabled={disabled}
          readOnly={!isReleaseOpen}
        />
      )}
    </Stack>
  )
}
