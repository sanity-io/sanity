import PropTypes from 'prop-types'
import React from 'react'
import {debounce} from 'lodash'

export default class SimpleImagePreview extends React.Component {
  static propTypes = {
    value: PropTypes.object
  }

  constructor(props, context) {
    super(props, context)
    this.handleLoadError = this.handleLoadError.bind(this)
    this.handleLoadSuccess = this.handleLoadSuccess.bind(this)
    this.loadImage = debounce(this.loadImage.bind(this), 500)
    this.state = {
      loading: false,
      errored: false
    }
  }

  componentDidMount() {
    const url = this.getFieldFromProps(this.props, 'url')
    if (url) {
      this.loadImage(url)
    }
  }

  handleLoadError() {
    this.setState({loading: false, errored: true})
  }
  handleLoadSuccess() {
    this.setState({loading: false, errored: false})
  }

  loadImage(url) {
    this.setState({loading: true, errored: false})
    const loader = new Image()
    loader.onerror = this.handleLoadError
    loader.onload = this.handleLoadSuccess
    loader.src = url
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value.getFieldValue('url') !== this.props.value.getFieldValue('url')) {
      this.setState({loading: true, errored: false})
      this.loadImage(this.getFieldFromProps(nextProps, 'url'))
    }
  }

  getFieldFromProps(props, field) {
    return props.value.getFieldValue(field).value
  }
  readValueFields(props, ...fields) {
    const {value} = props
    const res = {}
    fields.forEach(field => {
      res[field] = value.getFieldValue(field).value
    })
    return res
  }

  render() {
    const {url, caption} = this.readValueFields(this.props, 'url', 'caption')
    const {loading, errored} = this.state

    if (!url) {
      return <span>No image url</span>
    }

    if (loading) {
      return <span>Loading…</span>
    }

    if (errored) {
      return <span>Unable to load image</span>
    }

    return (
      <span>
        <span>
          <img src={url} title={caption} alt={caption} style={{maxWidth: 100, maxHeight: 100}} />
        </span>
        <span>{caption}</span>
      </span>
    )
  }
}
