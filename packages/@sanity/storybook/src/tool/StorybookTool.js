import React, {PureComponent} from 'react'
import config from 'config:@sanity/storybook'

const styles = {
  border: 0,
  width: '100%',
  height: '100%',
}

export default class StorybookTool extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {styles}
  }

  assignRef = ref => {
    this.iframe = ref
  }

  positionAbsolute = () => {
    this.setState(() => ({
      styles: Object.assign({}, styles, {position: 'absolute'})
    }))
  }

  componentDidMount() {
    if (this.iframe.parentNode.getAttribute('id') !== 'sanity') {
      return
    }

    this.raf = requestAnimationFrame(this.positionAbsolute)
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.raf)
  }

  render() {
    return (
      <iframe
        ref={this.assignRef}
        src={`http://localhost:${config.port}/`}
        style={this.state.styles}
      />
    )
  }
}
