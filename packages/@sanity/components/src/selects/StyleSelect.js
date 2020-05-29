/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import ArrowKeyNavigation from 'boundless-arrow-key-navigation/build'
import styles from 'part:@sanity/components/selects/style-style'
import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import CircleThinIcon from 'part:@sanity/base/circle-thin-icon'
import CheckCircleIcon from 'part:@sanity/base/circle-check-icon'
import {List} from 'part:@sanity/components/lists/default'
import Poppable from 'part:@sanity/components/utilities/poppable'

const modifiers = {
  preventOverflow: {
    padding: 0,
    boundariesElement: 'viewport'
  },
  offset: {
    offset: '0, 0'
  },
  flip: {
    enabled: false
  },
  customStyle: {
    enabled: true,
    fn: data => {
      data.styles = {
        ...data.styles,
        maxHeight: window ? window.innerHeight - data.popper.top - 10 : 300
      }
      return data
    }
  }
}

class StyleSelect extends React.PureComponent {
  static propTypes = {
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    value: PropTypes.array,
    renderItem: PropTypes.func,
    className: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        active: PropTypes.bool
      })
    ),
    transparent: PropTypes.bool
  }

  static defaultProps = {
    className: '',
    onChange() {},
    onOpen() {},
    onClose() {},
    items: [],
    transparent: false
  }

  state = {
    showList: false
  }

  buttonElement = React.createRef()
  firstItemElement = React.createRef()
  keyboardNavigation = false
  menuHasKeyboardFocus = false

  handleSelect = event => {
    event.preventDefault()
    event.stopPropagation()
    const index = event.currentTarget.dataset.index
    if (!index) {
      return
    }
    const item = this.props.items[index]
    if (!item) {
      return
    }
    this.props.onChange(item)
    this.handleCloseList()
    this.keyboardNavigation = false
  }

  handleOpenList = () => {
    if (this.props.disabled) {
      return
    }
    this.setState(
      {
        showList: true
      },
      () => {
        this.menuHasKeyboardFocus = true
        this.keyboardNavigation = true
        this.firstItemElement.current.focus()
        this.props.onOpen()
      }
    )
  }

  handleCloseList = () => {
    this.buttonElement.current.focus()
    this.setState(
      {
        showList: false
      },
      () => {
        this.props.onClose()
      }
    )
  }

  handleButtonClick = event => {
    if (this.state.showList) {
      this.handleCloseList()
    } else {
      this.handleOpenList()
    }
    this.keyboardNavigation = event.detail == 0
  }

  handleButtonKeyDown = event => {
    if (event.key == 'Enter') {
      this.handleOpenList()
    }
  }

  handleButtonBlur = event => {
    if (this.state.showList && !this.menuHasKeyboardFocus && this.keyboardNavigation) {
      this.handleCloseList()
    }
  }

  handleMenuBlur = event => {
    this.menuHasKeyboardFocus = false
    this.buttonElement.current.focus()
    this.handleCloseList()
  }

  handleItemKeyPress = event => {
    if (event.key === 'Enter') {
      this.handleSelect(event)
    }
  }

  render() {
    const {value, items, className, placeholder, renderItem, transparent, disabled} = this.props
    const {showList} = this.state

    return (
      <div
        tabIndex={0}
        onClick={this.handleButtonClick}
        onBlur={this.handleButtonBlur}
        onKeyPress={this.handleButtonKeyDown}
        className={`${styles.root} ${className || ''} ${transparent ? styles.transparent : ''} ${
          disabled ? styles.disabled : ''
        }`}
      >
        <div className={styles.inner} ref={this.buttonElement}>
          <div className={styles.selectContainer}>
            <span className={styles.title}>
              {value && value.length > 1 && 'Multiple'}
              {value && value.length == 1 && value[0].title}
              {!value && placeholder}
            </span>
            <span className={styles.arrow}>
              <ArrowIcon color="inherit" />
            </span>
          </div>
        </div>
        <Poppable
          onEscape={this.handleCloseList}
          modifiers={modifiers}
          onClickOutside={this.handleCloseList}
          popperClassName={styles.popper}
        >
          {showList && (
            <React.Fragment>
              <List className={styles.list}>
                <ArrowKeyNavigation>
                  {items.map((item, index) => {
                    const isSemiSelected = value && value.length > 1 && value.includes(item)
                    const isSelected = value && value.length === 1 && value[0].key == item.key
                    const classNames = `
                        ${isSelected ? styles.itemSelected : styles.item}
                        ${isSemiSelected ? styles.itemSemiSelected : ''}
                      `
                    return (
                      <div
                        key={`${item.key}${index}`}
                        title={item.title}
                        data-index={index}
                        onClick={this.handleSelect}
                        className={classNames}
                        onKeyPress={this.handleItemKeyPress} //eslint-disable-line react/jsx-no-bind
                        ref={index === 0 && this.firstItemElement}
                      >
                        <div className={styles.itemIcon}>
                          {isSelected && <CheckCircleIcon />}
                          {isSemiSelected && <CircleThinIcon />}
                        </div>
                        <div className={styles.itemContent}>{renderItem(item)}</div>
                      </div>
                    )
                  })}
                </ArrowKeyNavigation>
              </List>
              <div tabIndex={0} onFocus={this.handleMenuBlur} />
            </React.Fragment>
          )}
        </Poppable>
      </div>
    )
  }
}

export default StyleSelect
