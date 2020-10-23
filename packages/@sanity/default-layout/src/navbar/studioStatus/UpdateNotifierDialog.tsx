import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/default'
import {Package} from './types'

import styles from './UpdateNotifierDialog.css'

declare const __DEV__: boolean

interface Props {
  onClose: () => void
  severity: string
  outdated: Package[]
}

const upperFirst = (str: string) => `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`

class UpdateNotifierDialog extends React.PureComponent<Props> {
  static defaultProps = {
    outdated: [],
  }

  renderTable() {
    const {outdated} = this.props

    return (
      <>
        <div className={styles.versionsTable}>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Installed</th>
                <th>Latest</th>
                <th>Importance</th>
              </tr>
            </thead>
            <tbody>
              {outdated.map((pkg) => (
                <tr key={pkg.name}>
                  <td className={styles.npmValue}>{pkg.name}</td>
                  <td className={styles.npmValue}>{pkg.version}</td>
                  <td className={styles.npmValue}>{pkg.latest}</td>
                  <td>{upperFirst(pkg.severity || 'low')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.textContent}>
          <p>
            To upgrade, run the <a href="https://www.sanity.io/docs/reference/cli">Sanity CLI</a>{' '}
            upgrade command in your project folder from a terminal.
          </p>

          <pre className={styles.code}>
            <code>sanity upgrade</code>
          </pre>
        </div>
      </>
    )
  }

  renderContactDeveloper() {
    const {severity} = this.props
    return (
      <>
        <div className={styles.textContent}>
          {severity === 'high' ? (
            <p>
              This Studio should be updated. Please get in touch with the developers and ask them to
              upgrade it for you.
            </p>
          ) : (
            <p>
              This Studio has available upgrades. Consider getting in touch with the developers and
              ask them to upgrade it for you.
            </p>
          )}
        </div>

        <details className={styles.details}>
          <summary className={styles.summary}>Developer info</summary>
          {this.renderTable()}
        </details>
      </>
    )
  }

  render() {
    const {severity, onClose} = this.props

    return (
      <Dialog
        onClose={onClose}
        onClickOutside={onClose}
        title={severity === 'low' ? 'Upgrades available' : 'Studio is outdated'}
      >
        {__DEV__ && (
          <>
            <div className={styles.textContent}>
              <p>
                This Studio is no longer up to date{' '}
                {severity === 'high' ? 'and should be upgraded.' : 'and can be upgraded.'}
              </p>
            </div>

            {this.renderTable()}
          </>
        )}

        {!__DEV__ && this.renderContactDeveloper()}
      </Dialog>
    )
  }
}

export default UpdateNotifierDialog
