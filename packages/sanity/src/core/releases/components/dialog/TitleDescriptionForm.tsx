import {type EditableReleaseDocument} from '@sanity/client'
import {Box, Stack, Text} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {type ChangeEvent, useCallback, useEffect, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {Button} from '../../../../ui-components/button/Button'
import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useReleaseFormOptimisticUpdating} from '../../hooks/useReleaseFormOptimisticUpdating'

const MAX_DESCRIPTION_HEIGHT = 200

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

export const getIsReleaseOpen = (release: EditableReleaseDocument): boolean =>
  release.state !== 'archived' && release.state !== 'published'

function resizeTextarea(element: HTMLTextAreaElement): void {
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

export function TitleDescriptionForm({
  release,
  onChange,
  disabled,
  clampToModal = false,
}: {
  release: EditableReleaseDocument
  onChange: (changedValue: EditableReleaseDocument) => void
  disabled?: boolean
  /**
   * Detail-page usage: clamp the description to a fixed height (no internal scroll) and reveal the
   * full text in a modal via "Show more", so the header height — and the page layout — never shift
   * with the description length. The dialog usage keeps its default capped + internal-scroll cap.
   */
  clampToModal?: boolean
}): React.JSX.Element {
  const isReleaseOpen = getIsReleaseOpen(release)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const [scrollHeight, setScrollHeight] = useState(46)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const {t} = useTranslation()

  const isDescriptionClamped = clampToModal && scrollHeight > MAX_DESCRIPTION_HEIGHT

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
  }, [release.metadata.title])

  useEffect(() => {
    if (descriptionRef.current) {
      resizeTextarea(descriptionRef.current)
      setScrollHeight(descriptionRef.current.scrollHeight)
    }
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
      {shouldShowDescription && (
        <Stack space={2}>
          <DescriptionTextArea
            ref={descriptionRef}
            autoFocus={!localData.title}
            value={localData.description}
            placeholder={t('release.form.placeholder-describe-release')}
            onChange={handleDescriptionChange}
            onFocus={createFocusHandler('description')}
            onBlur={handleBlur}
            style={{
              height: `${isDescriptionClamped ? MAX_DESCRIPTION_HEIGHT : scrollHeight}px`,
              maxHeight: MAX_DESCRIPTION_HEIGHT,
              // clampToModal: hard clip (no scroll) — the full text opens in a modal, so the header
              // height and the page layout never shift. Dialog usage keeps the internal scrollbar.
              overflowY: clampToModal
                ? 'hidden'
                : scrollHeight > MAX_DESCRIPTION_HEIGHT
                  ? 'auto'
                  : 'hidden',
            }}
            data-testid="release-form-description"
            disabled={disabled}
            readOnly={!isReleaseOpen}
          />
          {isDescriptionClamped && (
            <Button
              data-testid="release-description-show-more"
              mode="bleed"
              onClick={() => setShowFullDescription(true)}
              style={{alignSelf: 'flex-start'}}
              text={t('release.form.description.show-more')}
            />
          )}
        </Stack>
      )}
      {showFullDescription && (
        <Dialog
          header={localData.title || t('release.placeholder-untitled-release')}
          id="release-full-description"
          onClose={() => setShowFullDescription(false)}
          width={1}
        >
          <Box padding={4}>
            <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
              {localData.description}
            </Text>
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
