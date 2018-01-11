import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/style-style'
import {uniqueId, includes} from 'lodash'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import enhanceWithClickOutside from 'react-click-outside'
import CircleThinIcon from 'part:@sanity/base/circle-thin-icon'
import CircleCheckIcon from 'part:@sanity/base/circle-check-icon'
import Escapable from '../utilities/Escapable'
import {List, Item} from 'part:@sanity/components/lists/default'

class StyleSelect extends React.Component {
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

  handleClickOutside = () => {
    this.handleCloseList()
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
      showList: true,
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
    const {value, transparent, items, className, placeholder} = this.props
    const {showList} = this.state

    return (
      <div
        className={`${styles.root} ${className || ''} ${transparent ? styles.transparent : ''}`}
        onBlur={this.handleCloseList}
        onKeyPress={this.handleRootKeyPress}
        tabIndex={0}
      >
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
        <Escapable onEscape={this.handleCloseList} />
        {
          showList && (
            <List className={styles.list}>
              {items.map((item, index) => {
                const isSemiSelected = value && value.length > 1 && includes(value, item)
                const isSelected = value && value.length === 1 && value[0] == item
                const classNames = `
                  ${isSelected ? styles.itemSelected : styles.item}
                  ${isSemiSelected ? styles.itemSemiSelected : ''}
                `
                return (
                  <Item
                    key={item.key}
                    title={item.title}
                    data-index={index}
                    onClick={this.handleSelect}
                    className={classNames}
                  >
                    <div className={styles.itemIcon}>
                      {
                        isSelected && <CircleCheckIcon />
                      }
                      {
                        isSemiSelected && <CircleThinIcon />
                      }
                    </div>
                    <div className={styles.itemContent}>
                      {this.props.renderItem(item)}
                    </div>
                  </Item>
                )
              })}
            </List>
          )
        }
      </div>
    )
  }
}

export default enhanceWithClickOutside(StyleSelect)
