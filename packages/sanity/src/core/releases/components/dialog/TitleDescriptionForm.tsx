import {type EditableReleaseDocument} from '@sanity/client'
import {Box, Stack, Text} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {type ChangeEvent, useCallback, useEffect, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useReleaseFormOptimisticUpdating} from '../../hooks/useReleaseFormOptimisticUpdating'

// Dialog usage: cap the description and let it scroll internally past this height.
const MAX_DESCRIPTION_HEIGHT = 200
// Detail-page (slim) resting height: a single line. The full text is revealed on hover.
const SLIM_TOOLTIP_MAX_WIDTH = 360

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

const DescriptionTextArea = styled.textarea<{$collapsed?: boolean}>((props) => {
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

    /* Slim resting state (detail page, not focused): clamp to a single line so the header stays a
       fixed, minimal height regardless of the description's length — the table below always starts
       in the same place. The full text is revealed on hover (tooltip) and on focus (grows to edit).
       !important beats both the JS-set inline height and imperative resize. */
    ${props.$collapsed &&
    css`
      height: ${font.text.sizes[2].lineHeight}px !important;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: text;
    `}
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
  slim = false,
}: {
  release: EditableReleaseDocument
  onChange: (changedValue: EditableReleaseDocument) => void
  disabled?: boolean
  /**
   * Detail-page usage: render the description as a single slim line at rest so the header — and the
   * table below it — keep a fixed, minimal height regardless of the description's length. The full
   * text is revealed on hover (tooltip); focusing the field grows it to a comfortable editing
   * height, and it collapses back on blur. The dialog usage (default) keeps its capped, internally
   * scrolling multi-line field.
   */
  slim?: boolean
}): React.JSX.Element {
  const isReleaseOpen = getIsReleaseOpen(release)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const [scrollHeight, setScrollHeight] = useState(46)
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false)
  const {t} = useTranslation()

  // At rest on the detail page the description is a single clamped line; focusing it lets it grow.
  const isDescriptionCollapsed = slim && !isDescriptionFocused

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
    // Only measure/grow when expanded: while collapsed the CSS clamp (with !important) owns the
    // height, and forcing height:auto here would read a clamped scrollHeight and fight it.
    if (descriptionRef.current && !isDescriptionCollapsed) {
      resizeTextarea(descriptionRef.current)
      setScrollHeight(descriptionRef.current.scrollHeight)
    }
  }, [release.metadata.description, isDescriptionCollapsed])

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

  const handleDescriptionFocus = useCallback(() => {
    setIsDescriptionFocused(true)
    createFocusHandler('description')()
  }, [createFocusHandler])

  const handleDescriptionBlur = useCallback(() => {
    setIsDescriptionFocused(false)
    handleBlur()
  }, [handleBlur])

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
        <Tooltip
          // Only the slim, collapsed, non-empty state reveals the full text on hover. While focused
          // (editing) or in the dialog usage, the field shows its own content, so the tooltip is off.
          disabled={!(isDescriptionCollapsed && Boolean(localData.description))}
          placement="bottom-start"
          content={
            <Box padding={2} style={{maxWidth: SLIM_TOOLTIP_MAX_WIDTH}}>
              <Text size={1} muted style={{whiteSpace: 'pre-wrap'}}>
                {localData.description}
              </Text>
            </Box>
          }
        >
          {/* Box anchors the tooltip and keeps descriptionRef free for the textarea's own sizing. */}
          <Box>
            <DescriptionTextArea
              ref={descriptionRef}
              $collapsed={isDescriptionCollapsed}
              autoFocus={!localData.title}
              value={localData.description}
              placeholder={t('release.form.placeholder-describe-release')}
              onChange={handleDescriptionChange}
              onFocus={handleDescriptionFocus}
              onBlur={handleDescriptionBlur}
              style={
                isDescriptionCollapsed
                  ? undefined
                  : {
                      height: `${slim ? scrollHeight : Math.min(scrollHeight, MAX_DESCRIPTION_HEIGHT)}px`,
                      maxHeight: slim ? undefined : MAX_DESCRIPTION_HEIGHT,
                      overflowY: !slim && scrollHeight > MAX_DESCRIPTION_HEIGHT ? 'auto' : 'hidden',
                    }
              }
              data-testid="release-form-description"
              disabled={disabled}
              readOnly={!isReleaseOpen}
            />
          </Box>
        </Tooltip>
      )}
    </Stack>
  )
}
