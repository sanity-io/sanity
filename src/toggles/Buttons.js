import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/toggles/buttons'
import Button from 'component:@sanity/components/buttons/default'

export default class ToggleButtons extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.node,
        title: PropTypes.string,
        action: PropTypes.func.isRequired
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

  handleClick(i, props) {
    this.setState({
      selected: i
    })

    props.items[i].action()

  }

  componentDidMount() {

  }

  render() {
    const {items, label} = this.props

    return (
      <div className={styles.root}>
        <div className={styles.label}>
          {label}
        </div>

        {
          items.map((item, i) => {
            const classes = `${this.state.selected == i ? styles.selectedButton : styles.button}`
            return (
              <Button
                ripple={false}
                key={i}
                className={classes}
                icon={item.icon}
                onClick={this.handleClick.bind(this, i, this.props)}
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
