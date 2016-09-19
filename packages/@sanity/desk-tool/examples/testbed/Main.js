import React from 'react'
import deskTool from '../../src'
import {RouterProvider} from 'router:@sanity/base/router'
import createHistory from 'history/createBrowserHistory'

const router = deskTool.router
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
    return (
      <RouterProvider location={this.state.location} router={router} onNavigate={handleNavigate}>
        <DeskTool />
      </RouterProvider>
    )
  }
}
