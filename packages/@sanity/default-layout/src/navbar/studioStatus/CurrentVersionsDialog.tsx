import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/default'

import styles from './UpdateNotifierDialog.css'

interface Props {
  onClose: () => void
  versions: {[key: string]: string}
}

class CurrentVersionsDialog extends React.PureComponent<Props> {
  static defaultProps = {
    versions: [],
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
          {Object.keys(versions).map((pkgName) => (
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
      <Dialog onClose={onClose} onClickOutside={onClose} size="medium">
        <div className={styles.content}>
          <h2 className={styles.dialogHeading}>This Studio is up to date</h2>
          <p>It was built using the latest versions of all packages.</p>
          <details className={styles.details}>
            <summary className={styles.summary}>List all installed packages</summary>
            {this.renderTable()}
          </details>
        </div>
      </Dialog>
    )
  }
}

export default CurrentVersionsDialog
