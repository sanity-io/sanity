import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/custom-style'
import cx from 'classnames'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'

export default class CustomSelect extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.object,
    renderItem: PropTypes.func,
    items: PropTypes.array
  }

  static defaultProps = {
    onChange() {}
  }

  state = {
    isOpen: false,
    activeIndex: -1
  }

  handleItemClick = event => {
    this.selectIndex(Number(event.currentTarget.getAttribute('data-item-index')))
    this.setState({isOpen: false})
  }

  selectIndex(index) {
    const item = this.props.items[index]
    this.props.onChange(item)
  }

  handleInnerClick = () => {
    this.setState({isOpen: true})
  }

  handleKeyDown = event => {
    const {isOpen, activeIndex} = this.state
    if (event.key === 'Enter') {
      if (isOpen && activeIndex > -1) {
        this.selectIndex(activeIndex)
        this.setState({isOpen: false})
      } else {
        this.setState({isOpen: true})
      }
    }

    if (event.key === 'Escape') {
      this.setState({isOpen: false})
    }

    const {items} = this.props

    const lastIndex = items.length - 1
    if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      if (!isOpen) {
        this.setState({isOpen: true})
        return
      }
      let nextIndex = activeIndex + (event.key === 'ArrowUp' ? -1 : 1)
      if (nextIndex < 0) nextIndex = lastIndex
      if (nextIndex > lastIndex) nextIndex = 0
      this.setState({activeIndex: nextIndex})
    }
  }

  render() {
    const {items, value, renderItem, ...rest} = this.props
    const {isOpen, activeIndex} = this.state

    return (
      <div className={styles.root} {...rest}>
        <div
          className={styles.inner}
          onClick={this.handleInnerClick}
          onKeyDown={this.handleKeyDown}
          tabIndex={0}
        >
          <div className={styles.selectContainer}>
            <span className={styles.text}>{renderItem(value)}</span>
            <div className={styles.arrow}>
              <FaAngleDown color="inherit" />
            </div>
          </div>
        </div>
        {isOpen && (
          <div className={styles.listContainer}>
            <ul className={styles.items} onKeyDown={this.handleKeyDown} ref={this.setListContainer}>
              {items.map((item, index) => {
                const isActive = index === activeIndex
                const isSelected = item === value
                const className = cx(styles.item, {
                  [styles.selectedItem]: isSelected,
                  [styles.activeItem]: isActive
                })
                return (
                  <li
                    key={index}
                    className={className}
                    onClick={this.handleItemClick}
                    data-item-index={index}
                  >
                    {renderItem(item, {index, isActive, isSelected})}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    )
  }
}
