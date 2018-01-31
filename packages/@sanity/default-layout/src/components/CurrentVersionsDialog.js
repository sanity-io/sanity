import React from 'react'
import PropTypes from 'prop-types'
import Button from 'part:@sanity/components/buttons/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import versions from 'sanity:versions'
import styles from './styles/UpdateNotifierDialog.css'

function CurrentVersionsDialog(props) {
  const {onClose} = props
  return (
    <Dialog isOpen onClose={onClose}>
      <div className={styles.content}>
        <div>
          <h2>Studio is up to date</h2>

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

          <Button color="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

CurrentVersionsDialog.propTypes = {
  onClose: PropTypes.func.isRequired
}

export default CurrentVersionsDialog
