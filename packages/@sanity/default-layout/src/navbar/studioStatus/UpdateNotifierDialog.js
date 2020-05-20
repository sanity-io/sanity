import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import styles from './UpdateNotifierDialog.css'

const upperFirst = str => `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`

class UpdateNotifierDialog extends React.PureComponent {
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
        <div className={styles.upgradeText}>
          <p>
            To upgrade, run the <a href="https://www.sanity.io/docs/reference/cli">Sanity CLI</a>{' '}
            upgrade command in your project folder from a terminal.
          </p>
          <code className={styles.code}>sanity upgrade</code>
        </div>
      </div>
    )
  }

  renderContactDeveloper() {
    const {severity} = this.props
    return (
      <div>
        <p>
          This Studio is now outdated.{' '}
          {severity === 'high'
            ? 'Please get in touch with your developers and ask them to upgrade it for you.'
            : 'Consider getting in touch with your developers and ask them to upgrade it for you.'}
        </p>

        <details className={styles.details}>
          <summary className={styles.summary}>Developer info</summary>
          {this.renderTable()}
        </details>
      </div>
    )
  }

  render() {
    const {severity, onClose} = this.props
    return (
      <Dialog isOpen onClose={onClose} onClickOutside={onClose}>
        <DialogContent size="medium" padding="large">
          <h2 className={styles.dialogHeading}>
            {severity === 'low' ? 'Upgrades available' : 'Studio is outdated'}
          </h2>
          {__DEV__ && (
            <p>
              This Studio is no longer up to date{' '}
              {severity === 'high' ? 'and should be upgraded.' : 'and can be upgraded.'}
            </p>
          )}
          {__DEV__ ? this.renderTable() : this.renderContactDeveloper()}
        </DialogContent>
      </Dialog>
    )
  }
}

export default UpdateNotifierDialog
