import {type EditableReleaseDocument} from '@sanity/client'
import {Stack} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ChangeEvent, useCallback, useEffect, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {ReleaseDescriptionPortableText} from './ReleaseDescriptionPortableText'

const MAX_DESCRIPTION_HEIGHT = 200

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
  const [value, setValue] = useState<EditableReleaseDocument>({
    _id: release?._id,
    metadata: {
      title: release?.metadata.title,
      description: release?.metadata.description,
    },
  })
  const {t} = useTranslation()

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
    (description: any) => {
      onChange({...value, metadata: {...release.metadata, description}})
      setValue({...value, metadata: {...release.metadata, description}})
    },
    [onChange, release.metadata, value],
  )

  const shouldShowDescription = isReleaseOpen || value.metadata.description

  return (
    <Stack space={3}>
      <TitleInput
        onChange={handleTitleChange}
        value={value.metadata.title}
        placeholder={t('release.placeholder-untitled-release')}
        data-testid="release-form-title"
        readOnly={!isReleaseOpen}
        disabled={disabled}
      />
      {shouldShowDescription && (
        <ReleaseDescriptionPortableText
          value={value.metadata.description}
          onChange={handleDescriptionChange}
          placeholder={t('release.form.placeholder-describe-release')}
          disabled={disabled}
          readOnly={!isReleaseOpen}
        />
      )}
    </Stack>
  )
}
