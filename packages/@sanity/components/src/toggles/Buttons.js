import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/toggles/buttons-style'
import Button from 'part:@sanity/components/buttons/default'

export default class ToggleButtons extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.object,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.node,
        title: PropTypes.string,
      })
    )
  }

  constructor(context, props) {
    super(context, props)

    this.handleClick = this.handleClick.bind(this)

    this.state = {
      selected: 0
    }
  }

  handleClick = event => {
    const {onChange} = this.props
    onChange(this._buttonElement.props.item)
  }

  setButtonElement = element => {
    this._buttonElement = element
  }

  render() {
    const {items, label, value} = this.props

    return (
      <div className={styles.root}>
        <div className={styles.label}>
          {label}
        </div>

        {
          items.map((item, i) => {
            return (
              <Button
                className={`
                  ${item == value ? styles.selectedButton : styles.button}
                `}
                kind="simple"
                key={item.key}
                icon={item.icon}
                item={item}
                onClick={this.handleClick}
                ref={this.setButtonElement}
              >
                {item.title}
              </Button>
            )
          })
        }
      </div>
    )
  }
}
