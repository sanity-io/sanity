/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/style-style'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import CircleThinIcon from 'part:@sanity/base/circle-thin-icon'
import CircleCheckIcon from 'part:@sanity/base/circle-check-icon'
import {List, Item} from 'part:@sanity/components/lists/default'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Poppable from 'part:@sanity/components/utilities/poppable'

const modifiers = {
  preventOverflow: {
    padding: 0
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

  render() {
    const {value, transparent, items, className, placeholder, renderItem} = this.props
    const {showList} = this.state

    const target = (
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
    )

    return (
      <div
        className={`${styles.root} ${className || ''} ${transparent ? styles.transparent : ''}`}
        onKeyPress={this.handleRootKeyPress}
        tabIndex={0}
      >
        <Poppable target={target} onEscape={this.handleCloseList} modifiers={modifiers}>
          {showList && (
            <div className={styles.popper}>
              <CaptureOutsideClicks onClickOutside={showList ? this.handleCloseList : undefined}>
                <div>
                  <List className={styles.list}>
                    {items.map((item, index) => {
                      const isSemiSelected = value && value.length > 1 && value.includes(item)
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
            </div>
          )}
        </Poppable>
      </div>
    )
  }
}

export default StyleSelect
