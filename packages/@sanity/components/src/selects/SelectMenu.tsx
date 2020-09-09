import React from 'react'
import cx from 'classnames'
import {List, Item} from 'part:@sanity/components/lists/default'
import scrollIntoView from 'dom-scroll-into-view'
import styles from './SelectMenu.css'

type Item = unknown

interface SelectMenuProps {
  items?: Item[]
  renderItem?: (item: Item, index: number) => React.ReactNode
  value?: Item
  highlightIndex?: number
  onSelect?: (item: Item) => void
}

export default class SelectMenu extends React.Component<SelectMenuProps> {
  scrollContainer: HTMLDivElement | null = null

  handleItemClick = event => {
    const index = Number(event.currentTarget.getAttribute('data-item-index'))
    const {onSelect, items} = this.props
    if (onSelect && items) onSelect(items[index])
  }

  componentDidUpdate(prevProps) {
    if (!this.scrollContainer) return

    if (prevProps.highlightIndex !== this.props.highlightIndex) {
      const itemElement = this.scrollContainer.querySelector(
        `[data-item-index="${this.props.highlightIndex}"]`
      )
      scrollIntoView(itemElement, this.scrollContainer, {onlyScrollIfNeeded: true})
    }
  }

  setScrollContainer = (domNode: HTMLDivElement | null) => {
    this.scrollContainer = domNode
  }

  render() {
    const {items, renderItem, highlightIndex, value} = this.props
    return (
      <div className={styles.scrollContainer} ref={this.setScrollContainer}>
        <List className={styles.list}>
          {items &&
            items.map((item, index) => {
              const classes = cx(
                styles.item,
                index === highlightIndex && styles.highlighted,
                item === value && styles.selected
              )
              return (
                <Item
                  key={index}
                  data-item-index={index}
                  onClick={this.handleItemClick}
                  className={classes}
                  tabIndex={0}
                >
                  {renderItem && renderItem(item, index)}
                </Item>
              )
            })}
        </List>
      </div>
    )
  }
}
