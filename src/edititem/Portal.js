import React from 'react'
import ReactDOM, {findDOMNode} from 'react-dom'

const KEYCODES = {
  ESCAPE: 27,
}

export default class Portal extends React.Component {

  constructor(props) {
    super()
    this.state = {active: false}
    this.handleWrapperClick = this.handleWrapperClick.bind(this)
    this.closePortal = this.closePortal.bind(this)
    this.handleOutsideMouseClick = this.handleOutsideMouseClick.bind(this)
    this.handleKeydown = this.handleKeydown.bind(this)
    this.portal = null
    this.node = null

  }

  componentDidMount() {
    if (this.props.closeOnEsc) {
      document.addEventListener('keydown', this.handleKeydown)
    }

    if (this.props.closeOnOutsideClick) {
      document.addEventListener('mouseup', this.handleOutsideMouseClick)
      document.addEventListener('touchstart', this.handleOutsideMouseClick)
    }

    if (this.props.isOpen) {
      this.openPortal()
    }
  }

  componentWillReceiveProps(newProps) {
    // portal's 'is open' state is handled through the prop isOpen
    if (typeof newProps.isOpen !== 'undefined') {

      if (this.state.active) {
        this.renderPortal(newProps)
      } else {
        this.openPortal(newProps)
      }

      if (!newProps.isOpen && this.state.active) {
        this.closePortal()
      }
    }

    // portal handles its own 'is open' state
    if (typeof newProps.isOpen === 'undefined' && this.state.active) {
      this.renderPortal(newProps)
    }
  }

  componentWillUnmount() {
    if (this.props.closeOnEsc) {
      document.removeEventListener('keydown', this.handleKeydown)
    }

    if (this.props.closeOnOutsideClick) {
      document.removeEventListener('mouseup', this.handleOutsideMouseClick)
      document.removeEventListener('touchstart', this.handleOutsideMouseClick)
    }

    this.closePortal(true)
  }

  handleWrapperClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (this.state.active) {
      return
    }
    this.openPortal()
  }

  openPortal(props = this.props) {
    this.setState({active: true})
    this.renderPortal(props, true)
  }

  closePortal(isUnmounted = false) {
    const resetPortalState = () => {
      if (this.node) {
        const {scrollContainer} = this.props
        ReactDOM.unmountComponentAtNode(this.node)
        if (scrollContainer) {
          scrollContainer.removeChild(this.node)
        } else {
          document.body.removeChild(this.node)
        }
      }
      this.portal = null
      this.node = null
      if (isUnmounted !== true) {
        this.setState({active: false})
      }
    }

    if (this.state.active) {
      if (this.props.beforeClose) {
        this.props.beforeClose(this.node, resetPortalState)
      } else {
        resetPortalState()
      }

      this.props.onClose()
    }
  }

  handleOutsideMouseClick(e) {
    if (!this.state.active) {
      return
    }

    const root = findDOMNode(this.portal)
    if (root.contains(e.target) || (e.button && e.button !== 0)) {
      return
    }

    e.stopPropagation()
    this.closePortal()
  }

  handleKeydown(e) {
    if (e.keyCode === KEYCODES.ESCAPE && this.state.active) {
      this.closePortal()
    }
  }

  renderPortal(props, isOpening) {
    if (!this.node) {
      this.node = document.createElement('div')
      if (props.scrollContainer) {
        props.scrollContainer.appendChild(this.node)
      } else {
        document.body.appendChild(this.node)
      }
    }

    if (isOpening) {
      this.props.onOpen(this.node)
    }

    let children = props.children
    // https://gist.github.com/jimfb/d99e0678e9da715ccf6454961ef04d1b
    if (typeof props.children.type === 'function') {
      children = React.cloneElement(props.children, {closePortal: this.closePortal})
    }

    this.portal = ReactDOM.unstable_renderSubtreeIntoContainer(
      this,
      children,
      this.node,
      this.props.onUpdate
    )
  }

  render() {
    if (this.props.openByClickOn) {
      return React.cloneElement(this.props.openByClickOn, {onClick: this.handleWrapperClick})
    }
    return null
  }
}

Portal.propTypes = {
  children: React.PropTypes.element.isRequired,
  scrollContainer: React.PropTypes.object.isRequired,
  openByClickOn: React.PropTypes.element,
  closeOnEsc: React.PropTypes.bool,
  closeOnOutsideClick: React.PropTypes.bool,
  isOpen: React.PropTypes.bool,
  onOpen: React.PropTypes.func,
  onClose: React.PropTypes.func,
  beforeClose: React.PropTypes.func,
  onUpdate: React.PropTypes.func,
}

Portal.defaultProps = {
  onOpen: () => {},
  onClose: () => {},
  onUpdate: () => {}
}
