/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/style-style'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import CircleThinIcon from 'part:@sanity/base/circle-thin-icon'
import CircleCheckIcon from 'part:@sanity/base/circle-check-icon'
import Stacked from '../utilities/Stacked'
import Escapable from '../utilities/Escapable'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import {List, Item} from 'part:@sanity/components/lists/default'
import {Manager, Target, Popper} from 'react-popper'
import {Portal} from '../utilities/Portal'

class StyleSelect extends React.PureComponent {
  static propTypes = {
    placeholder: PropTypes.string,
    onChange: PropTypes.func,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    value: PropTypes.array,
    renderItem: PropTypes.func,
    className: PropTypes.string,
    transparent: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        active: PropTypes.bool
      })
    )
  }

  static defaultProps = {
    className: '',
    onChange() {},
    onOpen() {},
    onClose() {}
  }

  state = {
    showList: false
  }

  handleSelect = event => {
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
  }

  handleOpenList = () => {
    this.setState({
      showList: true
    })
    this.props.onOpen()
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

  handleRootKeyPress = () => {
    this.handleOpenList()
  }

  setPopperElement = element => {
    this._popperElement = element
  }

  render() {
    const {value, transparent, items, className, placeholder, renderItem} = this.props
    const {showList} = this.state

    return (
      <Manager>
        <div
          className={`${styles.root} ${className || ''} ${transparent ? styles.transparent : ''}`}
          // onBlur={this.handleCloseList}
          onKeyPress={this.handleRootKeyPress}
          tabIndex={0}
        >
          <Target>
            <div className={styles.inner} onClick={this.handleInnerClick}>
              <div className={styles.selectContainer}>
                <span className={styles.text}>
                  {value && value.length > 1 && 'Multiple'}
                  {value && value.length == 1 && value[0].title}
                  {!value && placeholder}
                </span>
                <div className={styles.arrow}>
                  <FaAngleDown color="inherit" />
                </div>
              </div>
            </div>
          </Target>
          {showList && (
            <Portal>
              <Stacked>
                {isActive => {
                  return (
                    <div className={styles.portal}>
                      <Popper placement="bottom-start">
                        <Escapable onEscape={isActive ? this.handleCloseList : undefined} />
                        <CaptureOutsideClicks
                          onClickOutside={isActive ? this.handleCloseList : undefined}
                        >
                          <div ref={this.setPopperElement}>
                            <List className={styles.list}>
                              {items.map((item, index) => {
                                const isSemiSelected =
                                  value && value.length > 1 && value.includes(item)
                                const isSelected = value && value.length === 1 && value[0] == item
                                const classNames = `
                                    ${isSelected ? styles.itemSelected : styles.item}
                                    ${isSemiSelected ? styles.itemSemiSelected : ''}
                                  `
                                return (
                                  <div
                                    key={item.key}
                                    title={item.title}
                                    data-index={index}
                                    onClick={this.handleSelect}
                                    className={classNames}
                                  >
                                    <div className={styles.itemIcon}>
                                      {isSelected && <CircleCheckIcon />}
                                      {isSemiSelected && <CircleThinIcon />}
                                    </div>
                                    <div className={styles.itemContent}>{renderItem(item)}</div>
                                  </div>
                                )
                              })}
                            </List>
                          </div>
                        </CaptureOutsideClicks>
                      </Popper>
                    </div>
                  )
                }}
              </Stacked>
            </Portal>
          )}
        </div>
      </Manager>
    )
  }
}

export default StyleSelect
