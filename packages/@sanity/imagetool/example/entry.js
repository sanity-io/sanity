import Debug from 'debug'
import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'
import ImageToolDemo from './src/ImageToolDemo'
import HotspotImageDemo from './src/HotspotImageDemo'
import history from './src/history'
import IMAGES from './src/data/testImages'
import Link from './src/Link'

Debug.disable('')
Debug.enable(process.env.DEBUG)

const DEFAULT_IMAGE_INDEX = 4

class Root extends React.Component {
  static propTypes = {
    url: PropTypes.string,
  }
  renderUrl(url) {
    if (url === '/hotspotimage') {
      return <HotspotImageDemo src={IMAGES[DEFAULT_IMAGE_INDEX]} />
    }
    if (url === '/imagetool') {
      return <ImageToolDemo src={IMAGES[DEFAULT_IMAGE_INDEX]} />
    }
    return <div>No such demo</div>
  }
  render() {
    return (
      <div>
        <Link href="/hotspotimage">ImageTool</Link>
        <Link href="/imagetool">Hotspot Image</Link>
        {this.props.url !== '/' && this.renderUrl(this.props.url)}
      </div>
    )
  }
}

function render(location) {
  ReactDOM.render(<Root url={location.pathname} />, document.getElementById('content'))
}

history.listen(render)
render(history.location)
