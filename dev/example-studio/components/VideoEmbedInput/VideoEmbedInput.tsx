import React from 'react'
import {PatchEvent, set, unset} from '@sanity/base/form'
import {SanityPreview as Preview} from '@sanity/base/_unstable'
import getVideoId from 'get-video-id'
import humanizeList from 'humanize-list'
import {ReferenceSchemaType} from '@sanity/types'
import {SUPPORTED_SERVICES} from '../VideoEmbedPreview'
import styles from './VideoEmbedInput.module.css'

export interface VideoEmbedInputProps {
  type: ReferenceSchemaType
  onChange: (event: PatchEvent) => void
  value: {
    _type: unknown
    id: string
    service:
      | 'youtube'
      | 'vimeo'
      | 'vine'
      | 'videopress'
      | 'microsoftstream'
      | 'tiktok'
      | 'dailymotion'
      | null
  }
}

const ERROR_UNKNOWN_VIDEO_SERVICE = 'Could not find any video service from the given value 😢'
const ERROR_UNKNOWN_VIDEO_ID = 'Could not find any video from the given value 😢'

function select(ev: React.FocusEvent<HTMLTextAreaElement>) {
  ev.target.select()
}

export default class VideoEmbedInput extends React.Component<VideoEmbedInputProps> {
  state = {
    errorMessage: null,
    result: null,
  }

  handleSourceChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const {type} = this.props
    const inputValue = event.target.value

    this.setState({errorMessage: null})

    if (inputValue.length < 3) {
      return
    }

    const result = getVideoId(inputValue)
    if (!result) {
      this.setState({
        result: null,
        errorMessage: ERROR_UNKNOWN_VIDEO_SERVICE,
      })
      return
    }

    if (!result.id) {
      this.setState({
        result: null,
        errorMessage: ERROR_UNKNOWN_VIDEO_ID,
      })
      return
    }

    const nextValue = {
      _type: type.name,
      id: result.id,
      service: result.service,
    }

    const patch = inputValue === '' ? unset() : set(nextValue)
    this.props.onChange(PatchEvent.from(patch))
    this.setState({
      errorMessage: null,
      result,
    })
  }

  render() {
    const {errorMessage, result} = this.state
    const {type, value} = this.props
    const placeholder = `Paste URL or embed code from ${humanizeList(
      SUPPORTED_SERVICES.map((s) => s.title),
      {conjunction: 'or'}
    )}…`
    return (
      <>
        <textarea
          className={styles.pasteBox}
          onFocus={select}
          placeholder={placeholder}
          onChange={this.handleSourceChange}
        />
        {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
        {result && <div>Found a video 🙌</div>}
        {value && value.id && !errorMessage && <Preview value={value as any} type={type} />}
      </>
    )
  }
}
