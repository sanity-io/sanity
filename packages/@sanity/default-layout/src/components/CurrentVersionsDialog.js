import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Dialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import styles from './styles/UpdateNotifierDialog.css'

class CurrentVersionsDialog extends Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    versions: PropTypes.objectOf(PropTypes.string)
  }

  static defaultProps = {
    versions: []
  }

  renderTable() {
    const {versions} = this.props
    return (
      <table className={styles.versionsTable}>
        <thead>
          <tr>
            <th>Module</th>
            <th>Installed</th>
            <th>Latest</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(versions).map(pkgName => (
            <tr key={pkgName}>
              <td>{pkgName}</td>
              <td>{versions[pkgName]}</td>
              <td>{versions[pkgName]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  render() {
    const {onClose} = this.props
    return (
      <Dialog isOpen onClose={onClose} onClickOutside={onClose}>
        <DialogContent size="medium" padding="large">
          <div className={styles.content}>
            <h2 className={styles.dialogHeading}>Studio is up to date</h2>
            <p>Your Studio is running on the latest updates.</p>
            <details className={styles.details}>
              <summary className={styles.summary}>Show all installed modules</summary>
              {this.renderTable()}
            </details>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
}

export default CurrentVersionsDialog
