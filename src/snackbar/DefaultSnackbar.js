import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/snackbar/default'
import Button from 'component:@sanity/components/buttons/default'

export default class DefaultSnackbar extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['warning', 'error', 'success']),
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    time: PropTypes.number,
    action: PropTypes.obj.shape({
      title: PropTypes.string,
      action: PropTypes.func
    })
  }

  render() {

    const {kind, action, children} = this.props

    const style = styles[kind] || styles.root

    return (
      <div
        className={style}
      >
        <div className={styles.inner}>
          <div className={styles.content}>
            {children}
          </div>
          <div className={styles.action}>
            {
              action && <Button onClick={action.action}>{action.title}</Button>
            }
          </div>
        </div>
      </div>
    )
  }
}
