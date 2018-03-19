import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/Controller.css'
import {debounce} from 'lodash'
import Pane from './DefaultPane'
import elementResizeDetectorMaker from 'element-resize-detector'

export default class PanesController extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    selectedIndex: PropTypes.number,
    onChange: PropTypes.func
  }

  constructor(props) {
    super()
    this.state = {
      currentSelectedIndex: props.selectedIndex,
      updateId: 0,
      panesState: []
    }

    this.width = 0

    this.panesStatus = React.Children.toArray(props.children).map((pane, i) => {
      return {
        isCollapsed: false,
        minWidth: pane.props.minWidth,
        width: pane.props.minWidth + 1,
        element: null,
        isSelected: props.selectedIndex === i
      }
    })
  }

  _elementResizeDetector = elementResizeDetectorMaker({strategy: 'scroll'})

  componentDidMount() {
    this.setWidth()
    this.updatePanesStatus(this.props.children)
    this.checkPanes(this.props.children)
    // this._elementResizeDetector.listenTo(
    //   this._rootElement,
    //   this.handleResize
    // )
  }

  componentDidUpdate() {
    console.log('Component Did Update') // eslint-disable-line
    this.checkPanes(this.props.children)
  }

  shouldComponentUpdate(nextProps, nextState) {
    this.updatePanesStatus(nextProps.children)

    if (nextProps.children.length !== this.props.children.length) {
      return true
    }

    if (nextProps.selectedIndex !== this.props.selectedIndex) {
      return true
    }

    if (nextState.panesState !== this.state.panesState) {
      return true
    }

    return false
  }

  componentWillUnmount() {
    this._elementResizeDetector.uninstall(this._rootElement)
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      currentSelectedIndex: nextProps.selectedIndex
    })
    // if (nextProps.children.length !== this.props.children.length) {
    //this.updatePanesStatus(nextProps.children)
    // this.checkPanes(nextProps.children)
    // }
  }
  // onResize = debounce(() => {
  //  console.log('resize')
  // }, 1000 / 60)

  updatePanesStatus = panes => {
    console.log('Update Panes Status') // eslint-disable-line

    const newPanesStatus = React.Children.toArray(panes).map((pane, i) => {
      const minWidth = pane.props.minWidth
      const width =
        this.panesStatus[i] &&
        this.panesStatus[i].element &&
        this.panesStatus[i].element.offsetWidth
      let isCollapsed = this.panesStatus[i] && this.panesStatus[i].isCollapsed

      if (width < minWidth) {
        isCollapsed = true
      }

      return {
        isCollapsed: isCollapsed,
        minWidth: minWidth,
        width: width || null,
        element: this.panesStatus[i] && this.panesStatus[i].element,
        isSelected: this.props.selectedIndex === i
      }
    })

    console.log('old', this.panesStatus) // eslint-disable-line
    this.panesStatus = newPanesStatus
    console.log('new', this.panesStatus) // eslint-disable-line

    // if (newPanesStatus.length < this.panesStatus.length) {
    //   this.panesStatus = this.panesStatus.slice(0, newPanesStatus.length)
    //   console.log('remove pane', this.panesStatus)
    // } else {
    //   this.panesStatus = this.panesStatus.concat(
    //     newPanesStatus.slice()
    //   )
    //   console.log('new pane', this.panesStatus)
    // }
  }

  applyPanesStatusToState = () => {
    console.log('Applying PanesStatus To State') // eslint-disable-line
    // const panesState = this.panesStatus(pane => {
    //   return {isCollapsed: pane.isCollapsed}
    // })
    // this.setState({
    //   panesState: panesState
    // })
  }

  handleResize = debounce(event => {
    // this.setWidth()
    // this.checkPanes()
  }, 400)

  setWidth = () => {
    this.width = this._rootElement.offsetWidth
  }

  setRootElement = element => {
    console.log('Set root elment') // eslint-disable-line
    this._rootElement = element
  }

  checkPanes = panes => {
    console.log('Check panes') // eslint-disable-line

    let totalMinWidth = 0

    panes.forEach(pane => {
      if (pane.element) {
        pane.width = pane.element.offsetWidth

        if (pane.isCollapsed) {
          totalMinWidth += 30
        } else {
          totalMinWidth += pane.minWidth
        }
      } else {
        console.log('no element') // eslint-disable-line
      }

      this.render()
    })

    if (totalMinWidth < this.width) {
      console.log('totalMinWidth', totalMinWidth) //eslint-disable-line
      this.expandAll()
    } else {
      console.log('collapse some', totalMinWidth, '<', this.width) // eslint-disable-line
      this.collapseSome(panes)
    }
  }

  expandAll = panes => {
    console.log('Expand All Panes') // eslint-disable-line
    this.panesStatus = this.panesStatus.map(pane => {
      pane.isCollapsed = false
      return pane
    })
    this.render()
  }

  collapseSome = panes => {
    console.log('Collapse some') // eslint-disable-line
    // this.applyPanesStatusToState()
  }

  // Handle click
  handleClick(index, pane, event) {
    if (pane.props.onActive) {
      pane.props.onActive(pane)
    }
    if (this.props.onChange) {
      this.props.onChange(index, pane.props.value, pane, event)
    }
  }

  // Set panes element to panesStatus
  setPaneElement = (element, i) => {
    if (element) {
      this.panesStatus[i].element = element
    }
  }

  render() {
    const {children} = this.props
    const {currentSelectedIndex} = this.state

    const panes = React.Children.toArray(children)

    panes.forEach(pane => {
      console.log('pane', pane)
    })

    console.log('Render panes', panes) // eslint-disable-line
    const paneElements = panes.map((pane, i) => {
      const width = this.panesStatus[i].width
      const isSelected = i === currentSelectedIndex
      const isCollapsed = !isSelected || (!isSelected && this.panesStatus[i].isCollapsed)
      return (
        <div
          className={isCollapsed ? styles.paneCollapsed : styles.pane}
          key={pane.props.title}
          ref={element => this.setPaneElement(element, i)}
        >
          <Pane
            {...pane.props}
            index={i}
            width={width}
            isCollapsed={isCollapsed}
            isSelected={isSelected}
            updateId={this.state.updateId}
            onToggle={event => this.handleClick(i, pane, event)}
          />
        </div>
      )
    })

    return (
      <div className={styles.root} ref={this.setRootElement}>
        {paneElements}
      </div>
    )
  }
}
