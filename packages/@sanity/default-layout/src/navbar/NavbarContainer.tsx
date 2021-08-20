import React from 'react'
import {Router, Tool} from '../types'
import {Navbar} from './'

interface Props {
  createMenuIsOpen: boolean
  onCreateButtonClick: () => void
  onSearchClose: () => void
  onSearchOpen: () => void
  onSwitchTool: () => void
  onToggleMenu: () => void
  onUserLogout: () => void
  router: Router
  documentTypes: string[]
  searchIsOpen: boolean
  tools: Tool[]
}

interface State {
  showLabel: boolean
  showLabelMinWidth: number
  showToolMenu: boolean
  showToolMenuMinWidth: number
}

class NavbarContainer extends React.PureComponent<Props, State> {
  render() {
    const {
      createMenuIsOpen,
      onCreateButtonClick,
      onToggleMenu,
      onUserLogout,
      router,
      documentTypes,
      tools,
    } = this.props

    return (
      <Navbar
        createMenuIsOpen={createMenuIsOpen}
        onCreateButtonClick={onCreateButtonClick}
        onToggleMenu={onToggleMenu}
        onUserLogout={onUserLogout}
        router={router}
        documentTypes={documentTypes}
        tools={tools}
      />
    )
  }
}

export default NavbarContainer
