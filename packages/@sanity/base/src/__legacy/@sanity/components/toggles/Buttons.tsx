import React from 'react'
import styles from 'part:@sanity/components/toggles/buttons-style'
import ToggleButton from 'part:@sanity/components/toggles/button'

interface ToggleButtonItem {
  icon?: React.ComponentType<Record<string, unknown>>
  title?: string
}

interface ToggleButtonsProps {
  label?: string
  onChange?: (item: ToggleButtonItem) => void
  value?: ToggleButtonItem
  items?: ToggleButtonItem[]
}

// @todo: refactor to functional component
export default class ToggleButtons extends React.Component<ToggleButtonsProps> {
  handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const {onChange, items} = this.props
    const index = Number(event.currentTarget.getAttribute('data-index'))

    if (onChange && items) onChange(items[index])
  }

  render() {
    const {items, label, value} = this.props

    return (
      <div className={styles.root}>
        <div className={styles.label}>{label}</div>
        {items &&
          items.map((item, i) => {
            return (
              <ToggleButton
                // eslint-disable-next-line react/no-array-index-key
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
