import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/snackbar/default-style'
import Button from 'part:@sanity/components/buttons/default'

export default class DefaultSnackbar extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['danger', 'info', 'warning', 'error', 'success']),
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    time: PropTypes.number,
    action: PropTypes.shape({
      title: PropTypes.string,
      action: PropTypes.func
    })
  }

  static defaultProps = {
    kind: 'info',
    time: 4
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      visible: true
    }
  }

  componentDidMount() {
    this.timeOut = setTimeout(() => {
      this.setState({
        visible: false
      })
    }, this.props.time * 1000)
  }

  componentWillUnmount() {
    clearTimeout(this.timeOut)
  }

  handleAction() {
    this.props.action.action()
  }

  render() {

    const {kind, action, children} = this.props

    const style = `${styles[kind] || styles.root} ${this.state.visible ? styles.visible : styles.hidden}`

    return (
      <div className={style}>
        <div className={styles.inner}>
          <div className={styles.content}>
            {children}
          </div>
          <div className={styles.action}>
            {
              action && <Button inverted color="white" onClick={this.handleAction}>{action.title}</Button>
            }
          </div>
        </div>
      </div>
    )
  }
}
