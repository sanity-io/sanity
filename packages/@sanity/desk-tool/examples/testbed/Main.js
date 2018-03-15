import React from 'react'
import deskTool from '../../src'
import {route, RouterProvider, RouteScope} from 'part:@sanity/base/router'
import createHistory from 'history/createBrowserHistory'

const router = route('/example', route.scope('desktool', '/', deskTool.router))
const DeskTool = deskTool.component
const history = createHistory()

function handleNavigate(path, options = {}) {
  if (options.replace) {
    history.replace(path)
  } else {
    history.push(path)
  }
}

function readLocation() {
  return {pathname: document.location.pathname}
}

function checkRedirect(location) {
  const redirect = router.getRedirectBase(location.pathname)
  if (redirect) {
    handleNavigate(redirect, {replace: true})
  }
}
checkRedirect(readLocation())

export default class DeskToolTestBed extends React.Component {
  state = {location: readLocation()}

  handleLogClick = event => {
    // eslint-disable-next-line no-console
    console.log(this.state.editorValue.toJSON())
  }

  handleChange = event => {
    this.setState({editorValue: this.state.editorValue.patch(event.patch)})
  }

  componentWillMount() {
    history.listen(() => {
      this.setState({location: readLocation()})
    })
  }

  render() {
    const {location} = this.state
    if (router.isNotFound(location.pathname)) {
      return <div>Page not found</div>
    }
    const relativeWrapper = {
      height: '100vh',
      width: '100vw',
      position: 'absolute',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }
    return (
      <RouterProvider
        state={router.decode(location.pathname)}
        router={router}
        onNavigate={handleNavigate}
      >
        <RouteScope scope="desktool">
          <div style={relativeWrapper}>
            <DeskTool />
          </div>
        </RouteScope>
      </RouterProvider>
    )
  }
}
