import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Button from 'part:@sanity/components/buttons/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import styles from './styles/UpdateNotifierDialog.css'

const upperFirst = str => `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`

class UpdateNotifierDialog extends Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    severity: PropTypes.string.isRequired,
    outdated: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        latest: PropTypes.string,
        severity: PropTypes.string
      })
    )
  }

  static defaultProps = {
    outdated: []
  }

  renderTable() {
    const {outdated} = this.props
    return (
      <div>
        <table className={styles.versionsTable}>
          <thead>
            <tr>
              <th>Module</th>
              <th>Installed</th>
              <th>Latest</th>
              <th>Importance</th>
            </tr>
          </thead>
          <tbody>
            {outdated.map(pkg => (
              <tr key={pkg.name}>
                <td>{pkg.name}</td>
                <td>{pkg.version}</td>
                <td>{pkg.latest}</td>
                <td>{upperFirst(pkg.severity || 'low')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className={styles.upgradeText}>
          To upgrade, run <code className={styles.code}>sanity upgrade</code> in your studio.
        </p>
      </div>
    )
  }

  renderContactDeveloper() {
    const {severity} = this.props
    return (
      <div>
        <p>You are running an outdated studio.</p>

        {severity === 'high' ? (
          <p>Please get in touch with your developers and ask them to upgrade it for you.</p>
        ) : (
          <p>Consider getting in touch with your developers and ask them to upgrade it for you.</p>
        )}

        <details>
          <summary>Developer info</summary>
          {this.renderTable()}
        </details>
      </div>
    )
  }

  render() {
    const {severity, onClose} = this.props
    return (
      <Dialog isOpen onClose={onClose}>
        <div className={styles.content}>
          <div>
            <h2>{severity === 'low' ? 'New versions available' : 'Studio is outdated'}</h2>
            {__DEV__ ? this.renderTable() : this.renderContactDeveloper()}
            <Button color="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    )
  }
}

export default UpdateNotifierDialog
