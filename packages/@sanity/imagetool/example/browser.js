import Debug from 'debug'
import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'
import ImageToolDemo from './src/ImageToolDemo'
import HotspotImageDemo from './src/HotspotImageDemo'
import history from './src/history'
import {createRoute, createScope, RouterProvider, RouteScope, StateLink} from '@sanity/state-router'
import IMAGES from './src/data/testImages'

Debug.disable('')
Debug.enable(process.env.DEBUG)

const DEFAULT_IMAGE_INDEX = 4

const routes = createRoute('/*', [
  createRoute('/:demoName/*', params => {
    return params.demoName ? createScope(params.demoName, createRoute('/:imageIndex')) : []
  })
])

class Root extends React.Component {
  static contextTypes = {
    router: PropTypes.object
  }
  renderDemo(demoName) {
    const routerState = this.context.router.state
    const demoParams = routerState[demoName] || {}
    if (demoName === 'hotspotimage') {
      return <HotspotImageDemo src={IMAGES[demoParams.imageIndex || DEFAULT_IMAGE_INDEX]} />
    }
    if (demoName === 'imagetool') {
      return <ImageToolDemo src={IMAGES[demoParams.imageIndex || DEFAULT_IMAGE_INDEX]} />
    }
    return <div>No such demo</div>
  }
  render() {
    const {router} = this.context
    return (
      <div>
        <StateLink state={{demoName: 'imagetool'}}>ImageTool</StateLink>
        <StateLink state={{demoName: 'hotspotimage'}}>Hotspot Image</StateLink>
        {router.state.demoName && (
          <RouteScope scope={router.state.demoName}>
            {this.renderDemo(router.state.demoName)}
          </RouteScope>
        )}
      </div>
    )
  }
}

function handleNavigate(nexturl) {
  history.push(nexturl)
}
function render(location) {
  ReactDOM.render(
    <RouterProvider router={routes} location={location} onNavigate={handleNavigate}>
      <Root />
    </RouterProvider>,
    document.getElementById('content')
  )
}

history.listen(render)
render(history.location)
