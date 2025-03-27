import {type EditableReleaseDocument} from '@sanity/client'
import {Stack} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {type ChangeEvent, useCallback, useEffect, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {useTranslation} from '../../../i18n/hooks/useTranslation'

const MAX_DESCRIPTION_HEIGHT = 200

const TitleInput = styled.input`
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
  font-family: ${vars.font.text.family};
  font-weight: ${vars.font.text.weight.bold};
  font-size: ${vars.font.text.scale[4].fontSize};
  line-height: ${vars.font.text.scale[4].lineHeight};
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

  color: ${vars.color.tinted.default.fg[2]};

  &::placeholder {
    color: ${vars.color.tinted.default.border[4]};
  }
`

const DescriptionTextArea = styled.textarea`
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
  font-family: ${vars.font.text.family};
  font-weight: ${vars.font.text.weight.regular};
  font-size: ${vars.font.text.scale[2].fontSize}px;
  height: auto;
  line-height: ${vars.font.text.scale[2].lineHeight}px;
  margin: 0;
  max-width: 624px;
  position: relative;
  z-index: 1;
  display: block;
  color: ${vars.color.tinted.default.fg[2]};

  &::placeholder {
    color: ${vars.color.tinted.default.border[4]};
  }
`

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
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)

  const [scrollHeight, setScrollHeight] = useState(46)
  const [value, setValue] = useState<EditableReleaseDocument>({
    _id: release?._id,
    metadata: {
      title: release?.metadata.title,
      description: release?.metadata.description,
    },
  })
  const {t} = useTranslation()

  useEffect(() => {
    // make sure that the text area for the description has the right height initially
    if (descriptionRef.current) {
      setScrollHeight(descriptionRef.current.scrollHeight)
    }
  }, [])

  useEffect(() => {
    setValue(release)
  }, [release])

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault()
      const title = event.target.value
      onChange({...value, metadata: {...release.metadata, title}})
      // save the values to make input snappier while requests happen in the background
      setValue({...value, metadata: {...release.metadata, title}})
    },
    [onChange, release.metadata, value],
  )

  const handleDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      event.preventDefault()
      if (!isReleaseOpen) return

      const description = event.target.value
      onChange({...value, metadata: {...release.metadata, description}})
      // save the values to make input snappier while requests happen in the background
      setValue({...value, metadata: {...release.metadata, description}})

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
    [isReleaseOpen, onChange, release.metadata, value],
  )

  const shouldShowDescription = isReleaseOpen || value.metadata.description

  return (
    <Stack gap={3}>
      <TitleInput
        onChange={handleTitleChange}
        value={value.metadata.title}
        placeholder={t('release.placeholder-untitled-release')}
        data-testid="release-form-title"
        readOnly={!isReleaseOpen}
        disabled={disabled}
      />
      {shouldShowDescription && (
        <DescriptionTextArea
          ref={descriptionRef}
          autoFocus={!value}
          value={value.metadata.description}
          placeholder={t('release.form.placeholder-describe-release')}
          onChange={handleDescriptionChange}
          style={{
            height: `${scrollHeight}px`,
            maxHeight: MAX_DESCRIPTION_HEIGHT,
          }}
          data-testid="release-form-description"
          disabled={disabled}
          readOnly={!isReleaseOpen}
        />
      )}
    </Stack>
  )
}
