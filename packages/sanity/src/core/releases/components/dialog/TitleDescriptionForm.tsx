import {type EditableReleaseDocument} from '@sanity/client'
import {type PortableTextBlock} from '@sanity/types'
import {Stack} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ChangeEvent, useCallback, useEffect, useRef} from 'react'
import {css, styled} from 'styled-components'

import {RELEASE_PTE_DESCRIPTION} from '../../../config/types'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../studio/workspace'
import {useReleaseFormOptimisticUpdating} from '../../hooks/useReleaseFormOptimisticUpdating'
import {isPTEDescription} from '../../types/releaseDescription'
import {pteToString} from '../../util/descriptionConversion'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {ReleaseDescriptionInput} from '../input/ReleaseDescriptionInput'

const TitleTextArea = styled.textarea((props) => {
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
    min-height: ${font.text.sizes[4].lineHeight}px;
    margin: 0;
    position: relative;
    z-index: 1;
    display: block;
    /* NOTE: This is a hack to disable Chrome's autofill styles */
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

const MAX_DESCRIPTION_HEIGHT = 200

const DescriptionTextArea = styled.textarea((props) => {
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
    font-weight: ${font.text.weights.regular};
    font-size: ${font.text.sizes[2].fontSize}px;
    height: auto;
    line-height: ${font.text.sizes[2].lineHeight}px;
    margin: 0;
    max-width: 624px;
    position: relative;
    z-index: 1;
    display: block;
    color: ${color.input.default.enabled.fg};
    &::placeholder {
      color: ${color.input.default.enabled.placeholder};
    }
  `
})

function autoResizeTextArea(element: HTMLTextAreaElement | null): void {
  if (element) {
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }
}

export function getIsReleaseOpen(release: EditableReleaseDocument): boolean {
  return release.state !== 'archived' && release.state !== 'published'
}

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
  const {t} = useTranslation()
  const workspace = useWorkspace()
  const isPTE = workspace[RELEASE_PTE_DESCRIPTION] ?? false

  const {localData, updateLocalData, createFocusHandler, handleBlur} =
    useReleaseFormOptimisticUpdating({
      externalValue: release,
      id: release._id,
      extractData: useCallback(
        ({metadata}: EditableReleaseDocument) => ({
          title: metadata.title ?? '',
          description: metadata.description ?? '',
        }),
        [],
      ),
    })

  useEffect(() => {
    autoResizeTextArea(titleRef.current)
  }, [release.metadata.title])

  useEffect(() => {
    autoResizeTextArea(descriptionRef.current)
  }, [localData.description])

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      event.preventDefault()
      const title = event.target.value
      updateLocalData({title})
      onChange({...release, metadata: {...release.metadata, title}})
      autoResizeTextArea(titleRef.current)
    },
    [onChange, release, updateLocalData],
  )

  const handlePTEDescriptionChange = useCallback(
    (pteValue: PortableTextBlock[]) => {
      if (isReleaseOpen) {
        updateLocalData({description: pteValue})
        onChange({
          ...release,
          metadata: {
            ...release.metadata,
            description: pteValue as unknown as string,
          },
        })
      }
    },
    [isReleaseOpen, onChange, release, updateLocalData],
  )

  const handlePlainTextDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      if (isReleaseOpen) {
        const description = event.target.value
        updateLocalData({description})
        onChange({...release, metadata: {...release.metadata, description}})
        autoResizeTextArea(descriptionRef.current)
      }
    },
    [isReleaseOpen, onChange, release, updateLocalData],
  )

  const plainTextDescription = isPTE
    ? ''
    : isPTEDescription(localData.description)
      ? pteToString(localData.description)
      : (localData.description as string)

  const shouldShowDescription = isReleaseOpen || localData.description

  return (
    <Stack space={3}>
      <TitleTextArea
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
      {shouldShowDescription &&
        (isPTE ? (
          <ReleaseDescriptionInput
            value={localData.description}
            onChange={handlePTEDescriptionChange}
            onFocus={createFocusHandler('description')}
            onBlur={handleBlur}
            placeholder={t('release.form.placeholder-describe-release')}
            disabled={disabled}
            readOnly={!isReleaseOpen}
            excludeReleaseId={getReleaseIdFromReleaseDocumentId(release._id)}
          />
        ) : (
          <DescriptionTextArea
            ref={descriptionRef}
            onChange={handlePlainTextDescriptionChange}
            onFocus={createFocusHandler('description')}
            onBlur={handleBlur}
            value={plainTextDescription}
            placeholder={t('release.form.placeholder-describe-release')}
            data-testid="release-form-description"
            readOnly={!isReleaseOpen}
            disabled={disabled}
            style={{maxHeight: MAX_DESCRIPTION_HEIGHT, overflowY: 'auto'}}
          />
        ))}
    </Stack>
  )
}
