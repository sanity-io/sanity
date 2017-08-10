// @flow
import React from 'react'
import cx from 'classnames'
import {List, Item} from 'part:@sanity/components/lists/default'
import styles from './styles/SelectMenu.css'
import scrollIntoView from 'dom-scroll-into-view'

export default class SelectMenu extends React.Component {
  props: {
    items: Array<any>,
    renderItem: (item: any) => Element,
    value: any,
    highlightIndex: number,
    onSelect: (item: any) => void
  }

  handleItemClick = event => {
    const index = Number(event.currentTarget.getAttribute('data-item-index'))
    const {onSelect, items} = this.props
    onSelect(items[index])
  }

  componentDidUpdate(prevProps) {
    if (prevProps.highlightIndex !== this.props.highlightIndex) {
      const itemElement = this.scrollContainer.querySelector(`[data-item-index="${this.props.highlightIndex}"]`)
      scrollIntoView(itemElement, this.scrollContainer, {onlyScrollIfNeeded: true})
    }
  }

  setScrollContainer = domNode => this.scrollContainer = domNode

  render() {
    const {items, renderItem, highlightIndex, value} = this.props
    return (
      <div className={styles.root}>
        <div className={styles.scrollContainer} ref={this.setScrollContainer}>
          <List>
            {items.map((item, index) => {
              const classes = cx(styles.item, {
                [styles.highlighted]: index === highlightIndex,
                [styles.selected]: item === value
              })
              return (
                <Item data-item-index={index} onClick={this.handleItemClick} className={classes}>
                  {renderItem(item, index)}
                </Item>
              )
            })}
          </List>
        </div>
      </div>
    )
  }
}
