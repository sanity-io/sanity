import PropTypes from 'prop-types'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import PatchEvent, {set, unset} from '@sanity/form-builder/PatchEvent'
import Preview from 'part:@sanity/base/preview'
import styles from './VideoEmbedInput.css'
import getVideoId from 'get-video-id'
import {SUPPORTED_SERVICES} from '../VideoEmbedPreview'
import humanizeList from 'humanize-list'

const ERROR_UNKNOWN_VIDEO_SERVICE = 'Could not find any video service from the given value 😢'
const ERROR_UNKNOWN_VIDEO_ID = 'Could not find any video from the given value 😢'

function select(ev) {
  ev.target.select()
}

export default class VideoEmbedInput extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string
    }).isRequired,

    level: PropTypes.number,
    value: PropTypes.shape({
      _type: PropTypes.string,
      id: PropTypes.string,
      service: PropTypes.string,
    }),
    onChange: PropTypes.func.isRequired
  };

  state = {
    errorMessage: null,
    result: null,
    shouldReplace: false
  }

  handleSourceChange = event => {
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
        errorMessage: ERROR_UNKNOWN_VIDEO_SERVICE
      })
      return
    }

    if (!result.id) {
      this.setState({
        result: null,
        errorMessage: ERROR_UNKNOWN_VIDEO_ID
      })
      return
    }

    const nextValue = {
      _type: type.name,
      id: result.id,
      service: result.service
    }

    const patch = inputValue === '' ? unset() : set(nextValue)
    this.props.onChange(PatchEvent.from(patch))
    this.setState({
      errorMessage: null,
      result
    })
  }

  render() {
    const {errorMessage, result} = this.state
    const {type, value, level} = this.props
    return (
      <FormField
        label={type.title}
        level={level}
        description={type.description}
      >
        <div className={styles.description}>
          Any video URL or embed code will do. Supports {humanizeList(SUPPORTED_SERVICES.map(s => s.title))}.
        </div>
        <textarea
          className={styles.pasteBox}
          type="text"
          onFocus={select}
          placeholder="Paste or enter…"
          onChange={this.handleSourceChange}
        />
        {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
        {result && <div>Found a video 🙌</div>}
        {value && value.id && !errorMessage && <Preview value={value} type={type} />}
      </FormField>
    )
  }
}
