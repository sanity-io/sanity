import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/Controller.css'
import {debounce} from 'lodash'
import Pane from './DefaultPane'
import elementResizeDetectorMaker from 'element-resize-detector'


export default class PanesController extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    selectedIndex: PropTypes.number,
    onChange: PropTypes.func
  }

  // onResize = debounce(() => {
  //  console.log('resize')
  // }, 1000 / 60)

  state = {
    currentSelectedIndex: this.props.selectedIndex,
    updateId: 0
  }

  width = 0

  panesStatus = React.Children.toArray(this.props.children).map((pane, i) => {
    return {
      isCollapsed: false,
      minWidth: pane.props.minWidth,
      width: 0,
      isSelected: this.props.selectedIndex === i
    }
  })

  _elementResizeDetector = elementResizeDetectorMaker({strategy: 'scroll'})


  componentDidMount() {
    console.log('componentDidMount')
    this.setWidth()
    const panes = React.Children.toArray(this.props.children)
    this.checkPanes(panes)

    this._elementResizeDetector.listenTo(
      this._rootElement,
      this.handleResize
    )
  }

  updatePaneStatus = children => {
    const newPanesStatus = React.Children.toArray(children).map((pane, i) => {
      return {
        isCollapsed: false,
        minWidth: pane.props.minWidth,
        width: 0,
        isSelected: this.props.selectedIndex === i
      }
    })

    this.panesStatus = newPanesStatus


    // if (newPanesStatus.length < this.panesStatus.length) {
    //   this.panesStatus = this.panesStatus.slice(0, newPanesStatus.length)
    //   console.log('remove pane', this.panesStatus)
    // } else {
    //   this.panesStatus = this.panesStatus.concat(newPanesStatus)
    //   console.log('new pane', this.panesStatus)
    // }

  }

  componentWillUnmount() {
    this._elementResizeDetector.uninstall(this._rootElement)
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      currentSelectedIndex: nextProps.selectedIndex
    })
    if (nextProps.children.length !== this.props.children.length) {
      this.updatePaneStatus(nextProps.children)
      this.checkPanes(nextProps.children)
    }
  }

  handleResize = debounce(event => {
    // this.setWidth()
    // this.checkPanes()
  }, 400)

  setWidth = () => {
    this.width = this._rootElement.offsetWidth
  }

  setRootElement = element => {
    this._rootElement = element
  }

  checkPanes = panes => {
    console.log('checkpanes')
    let totalMinWidth = 0

    panes.forEach(pane => {
      console.log('minWidthPane', pane.props.minWidth)
      totalMinWidth += pane.props.minWidth
    })

    if (totalMinWidth < this.width) {
      console.log('totalMinWidth', totalMinWidth)
      // this.expandAll()
    } else {
      console.log('collapse some', totalMinWidth, '<', this.width)
      this.collapseSome()
    }
  }

  collapseSome() {
    const minimizedWidth = 30

    // const panesStatus = this.state.panesStatus.map((pane, i) => {
    //
    //   const remainingPanes = this.state.panesStatus.splice(i)
    //
    //   const remainingSpace = 0
    //
    //
    //   console.log('remainingSpace', remainingSpace)
    //
    //   // if (i === 0 && pane) {
    //   //   pane.isCollapsed = true
    //   //   return pane
    //   // }
    //   return pane
    // })
    // this.setState({
    //   panesStatus: panesStatus
    // })
  }

  handleClick(index, pane, event) {
    const panes = React.Children.toArray(this.props.children)
    if (index === this.state.currentSelectedIndex) {
      if (index === panes.length) {
        console.error('Last pane can not close if active')
        return
      }

      this.setState({
        currentSelectedIndex: index + 1,
        updateId: this.state.updateId + 1
      })
    } else {
      this.setState({
        currentSelectedIndex: index,
        updateId: this.state.updateId + 1
      })
    }

    if (pane.props.onActive) {
      pane.props.onActive(pane)
    }

    // onChange callback
    if (this.props.onChange) {
      this.props.onChange(index, pane.props.value, pane, event)
    }
  }

  setPaneElement = (element, i) => {
    if (element && i) {
      this.panesStatus[i] = element.offsetWidth
    }
  }

  render() {
    const {children} = this.props
    const {currentSelectedIndex} = this.state
    const {panesStatus} = this

    const panes = React.Children.toArray(children)

    const paneElements = panes.map((pane, i) => {
      const isCollapsed = panesStatus[i].isCollapsed
      const width = panesStatus[i].width
      const isSelected = i === currentSelectedIndex
      return (
        <div className={isCollapsed ? styles.paneCollapsed : styles.pane} key={pane.props.title} ref={element => this.setPaneElement(element, i)}>
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
