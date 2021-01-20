import {FormField} from '@sanity/base/components'
import PropTypes from 'prop-types'
import React from 'react'
import {PatchEvent, set, unset} from 'part:@sanity/form-builder/patch-event'
import Preview from 'part:@sanity/base/preview'
import getVideoId from 'get-video-id'
import humanizeList from 'humanize-list'
import {SUPPORTED_SERVICES} from '../VideoEmbedPreview'
import styles from './VideoEmbedInput.css'

const ERROR_UNKNOWN_VIDEO_SERVICE = 'Could not find any video service from the given value 😢'
const ERROR_UNKNOWN_VIDEO_ID = 'Could not find any video from the given value 😢'

export default class VideoEmbedInput extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string,
    }).isRequired,

    level: PropTypes.number,
    value: PropTypes.shape({
      _type: PropTypes.string,
      id: PropTypes.string,
      service: PropTypes.string,
    }),
    onChange: PropTypes.func.isRequired,
  }

  state = {
    errorMessage: null,
    result: null,
  }

  handleSourceChange = (event) => {
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
    const {level, markers, onBlur, onFocus, presence, type, value} = this.props
    const placeholder = `Paste URL or embed code from ${humanizeList(
      SUPPORTED_SERVICES.map((s) => s.title),
      {conjunction: 'or'}
    )}…`

    return (
      <FormField
        __unstable_markers={markers}
        __unstable_presence={presence}
        description={type.description}
        level={level}
        title={type.title}
      >
        <textarea
          className={styles.pasteBox}
          type="text"
          onBlur={onBlur}
          onFocus={(event) => {
            event.currentTarget.select()
            onFocus()
          }}
          placeholder={placeholder}
          onChange={this.handleSourceChange}
        />
        {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
        {result && <div>Found a video 🙌</div>}
        {value && value.id && !errorMessage && <Preview value={value} type={type} />}
      </FormField>
    )
  }
}
