import React, {PropTypes} from 'react'
import ImageTool from './ImageTool'
import PureRenderMixin from 'react-addons-pure-render-mixin'

export default React.createClass({
  displayName: 'LoadImageProxy',
  mixins: [PureRenderMixin],
  propTypes: {
    imageUrl: PropTypes.string.isRequired
  },

  getInitialState() {
    return {
      loaded: false,
      error: null
    }
  },

  componentDidMount() {
    this.image = new Image()

    this.image.onload = () => {
      this.setState({
        loaded: true,
        error: null
      })
    }

    this.image.onerror = () => {
      this.setState({
        error: new Error(`Could not load image from ${JSON.stringify(this.props.imageUrl)}`)
      })
    }
    this.image.src = this.props.imageUrl
  },

  componentDidUpdate(prevProps) {
    if (prevProps.imageUrl !== this.props.imageUrl) {
      this.image.src = this.props.imageUrl
    }
  },

  render() {
    if (this.state.error) {
      return <div style={{display: 'inline-block'}}>{this.state.error.message}</div>
    }
    if (!this.state.loaded) {
      return <div style={{display: 'inline-block'}}>...</div>
    }
    return <ImageTool {...this.props} image={this.image} />
  }
})
