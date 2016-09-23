import React, {PropTypes} from 'react'
import ImageTool from './ImageTool'

export default class ImageToolLoadImageProxy extends React.PureComponent {
  static propTypes = {
    imageUrl: PropTypes.string.isRequired
  }

  state = {
    loaded: false,
    error: null
  }

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
  }

  componentDidUpdate(prevProps) {
    if (prevProps.imageUrl !== this.props.imageUrl) {
      this.image.src = this.props.imageUrl
    }
  }

  render() {
    if (this.state.error) {
      return <div style={{display: 'inline-block'}}>{this.state.error.message}</div>
    }
    if (!this.state.loaded) {
      return <div style={{display: 'inline-block'}}>...</div>
    }
    return <ImageTool {...this.props} image={this.image} />
  }
}
