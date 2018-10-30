import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/toggles/buttons-style'
import ToggleButton from 'part:@sanity/components/toggles/button'

const ITEM_SHAPE = {
  icon: PropTypes.node,
  title: PropTypes.string
}
export default class ToggleButtons extends React.Component {
  static propTypes = {
    label: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.shape(ITEM_SHAPE),
    items: PropTypes.arrayOf(PropTypes.shape(ITEM_SHAPE))
  }

  handleClick = event => {
    const {onChange, items} = this.props
    const index = Number(event.currentTarget.getAttribute('data-index'))
    onChange(items[index])
  }

  render() {
    const {items, label, value} = this.props

    return (
      <div className={styles.root}>
        <div className={styles.label}>{label}</div>
        {items.map((item, i) => {
          return (
            <ToggleButton
              kind="simple"
              key={i}
              icon={item.icon}
              onClick={this.handleClick}
              selected={value === items[i]}
              data-index={i}
            >
              {item.title}
            </ToggleButton>
          )
        })}
      </div>
    )
  }
}
