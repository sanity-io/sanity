/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/style-style'
import {uniqueId, includes} from 'lodash'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import enhanceWithClickOutside from 'react-click-outside'
import CircleThinIcon from 'part:@sanity/base/circle-thin-icon'
import CircleCheckIcon from 'part:@sanity/base/circle-check-icon'

class StyleSelect extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    onOpen: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClose: PropTypes.func,
    value: PropTypes.array,
    error: PropTypes.bool,
    renderItem: PropTypes.func,
    className: PropTypes.string,
    transparent: PropTypes.bool,
    disabled: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        active: PropTypes.bool
      })
    )
  }

  static defaultProps = {
    className: '',
    disabled: false,
    onChange() {},
    onOpen() {},
    onClose() {},
    items: []
  }

  _inputId = uniqueId('StyleSelect')
  _keyUpHandler = null
  _keyDownHandler = null

  state = {
    hasFocus: false,
    arrowNavigationPosition: 0
  }

  componentDidMount() {
    this._keyUpHandler = document.body.addEventListener('keyup', this.handleKeyUp)
    this._keyDownHandler = document.body.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    document.body.removeEventListener('keyup', this._keyUpHandler)
    document.body.removeEventListener('keydown', this._keyDownHandler)
  }

  handleClickOutside = () => {
    this.handleCloseList()
  }

  handleFocus = event => {
    this.setState({
      hasFocus: true
    })
    if (this.props.onFocus) {
      this.props.onFocus(event)
    }
  }

  handleBlur = event => {
    this.setState({
      hasFocus: false
    })
    if (this.props.onBlur) {
      this.props.onBlur(event)
    }
  }

  handleSelect = item => {
    this.props.onChange(item)
    this.handleCloseList()
  }

  handleOpenList = () => {
    const {disabled} = this.props
    if (!disabled) {
      this.setState({
        showList: true
      })
      this.props.onOpen()
    }
  }

  handleCloseList = () => {
    this.setState({
      showList: false
    })
    this.props.onClose()
  }

  handleInnerClick = () => {
    if (this.state.showList) {
      this.handleCloseList()
    } else {
      this.handleOpenList()
    }
  }

  handleKeyDown = event => {
    const {items, value} = this.props
    const {hasFocus, showList, arrowNavigationPosition} = this.state
    if (!hasFocus) {
      return
    }
    if (event.key === 'Tab') {
      this.handleCloseList()
    }
    if (items) {
      if (['ArrowUp', 'ArrowDown'].includes(event.key) && !showList) {
        const openPosition = value ? items.indexOf(value[0]) || 0 : 0
        this.setState({showList: true, arrowNavigationPosition: openPosition})
      }
      if (showList && event.key == 'ArrowUp' && arrowNavigationPosition > 0) {
        this.setState({
          arrowNavigationPosition: arrowNavigationPosition - 1
        })
        return
      }
      if (showList && event.key == 'ArrowDown' && arrowNavigationPosition < items.length - 1) {
        this.setState({
          arrowNavigationPosition: arrowNavigationPosition + 1
        })
      }
    }
  }

  handleKeyUp = event => {
    const {items} = this.props
    const {hasFocus, arrowNavigationPosition} = this.state
    if (!hasFocus) {
      return
    }
    if (event.key === 'Escape') {
      this.setState({showList: false})
    }
    if (event.key === 'Enter') {
      this.setState({showList: true})
      this.handleSelect(items[arrowNavigationPosition])
    }
  }

  render() {
    const {className, disabled, error, items, transparent, value} = this.props

    const {hasFocus, showList} = this.state

    return (
      <div
        className={`
          ${styles.root}
          ${error ? styles.error : ''}
          ${transparent ? styles.transparent : ''}
          ${disabled ? styles.disabled : ''}
          ${className || ''}
        `}
      >
        <span className={styles.selectContainer} tabIndex={0} onClick={this.handleInnerClick}>
          <span className={styles.text}>
            {value && value.length > 1 && 'Multiple'}
            {value && value.length === 1 && value[0].title}
          </span>
          <div className={styles.functions}>
            <FaAngleDown color="inherit" />
          </div>
        </span>

        <div className={`${showList ? styles.listContainer : styles.listContainerHidden}`}>
          {items.map((item, index) => {
            const isMultiple = value && value.length > 1 && includes(value, item)
            const isActive = value && value.length === 1 && value[0] == item
            const isSelected = index === this.state.arrowNavigationPosition
            const classNames = [
              isActive ? styles.itemActive : styles.item,
              isMultiple ? styles.itemMultiple : null,
              isSelected ? styles.itemSelected : null
            ].filter(Boolean)
            return (
              <a
                className={classNames.join(' ')}
                key={item.key}
                title={item.title}
                onClick={() => this.handleSelect(item)}
              >
                <div className={styles.itemIcon}>
                  {isActive && <CircleCheckIcon />}
                  {isMultiple && <CircleThinIcon />}
                </div>
                <div className={styles.itemContent}>{this.props.renderItem(item)}</div>
              </a>
            )
          })}
        </div>
      </div>
    )
  }
}

export default enhanceWithClickOutside(StyleSelect)
