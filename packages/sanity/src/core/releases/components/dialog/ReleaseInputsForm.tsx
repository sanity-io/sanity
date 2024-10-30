import {Box} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ChangeEvent, useCallback, useEffect, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type EditableReleaseDocument} from '../../../store'
import {DEFAULT_RELEASE_TYPE} from '../../util/const'

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

export function ReleaseInputsForm({
  release,
  onChange,
}: {
  release: EditableReleaseDocument
  onChange: (changedValue: EditableReleaseDocument) => void
}): JSX.Element {
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const [scrollHeight, setScrollHeight] = useState(0)
  const [value, setValue] = useState((): EditableReleaseDocument => {
    return {
      _id: release?._id,
      metadata: {
        title: release?.metadata.title,
        description: release?.metadata.description,
        intendedPublishAt: release?.metadata?.intendedPublishAt,
        releaseType: release?.metadata.releaseType || DEFAULT_RELEASE_TYPE,
      },
    } as const
  })
  const {t} = useTranslation()

  useEffect(() => {
    // make sure that the text area for the description has the right height initially
    if (descriptionRef.current) {
      setScrollHeight(descriptionRef.current.scrollHeight)
    }
  }, [])

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault()
      const title = event.target.value
      onChange({...value, metadata: {...value.metadata, title}})
      // save the values to make input snappier while requests happen in the background
      setValue({...value, metadata: {...value.metadata, title}})
    },
    [onChange, value],
  )

  const handleDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      event.preventDefault()
      const description = event.target.value
      onChange({...value, metadata: {...value.metadata, description}})
      // save the values to make input snappier while requests happen in the background
      setValue({...value, metadata: {...value.metadata, description}})

      /** we must reset the height in order to make sure that if the text area shrinks,
       * that the actual input will change height as well */
      if (descriptionRef.current) {
        descriptionRef.current.style.height = 'auto'
        descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`
      }

      setScrollHeight(event.currentTarget.scrollHeight)
    },
    [onChange, value],
  )

  return (
    <>
      <Box paddingBottom={3}>
        <TitleInput
          onChange={handleTitleChange}
          value={value.metadata.title}
          placeholder={t('release.form.placeholer-untitled-release')}
          data-testid="release-form-title"
        />
      </Box>
      <Box>
        <DescriptionTextArea
          ref={descriptionRef}
          autoFocus={!value}
          value={value.metadata.description}
          placeholder={t('release.form.placeholer-describe-release')}
          onChange={handleDescriptionChange}
          style={{
            height: `${scrollHeight}px`,
          }}
          data-testid="release-form-description"
        />
      </Box>
    </>
  )
}
