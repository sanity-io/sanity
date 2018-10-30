import React, {Component} from 'react'
import WarningIcon from 'part:@sanity/base/warning-icon'
import VersionChecker from 'part:@sanity/base/version-checker'
import UpdateNotifierDialog from './UpdateNotifierDialog'
import CurrentVersionsDialog from './CurrentVersionsDialog'
import styles from './styles/UpdateNotifier.css'

const logError = err => console.error(err)
const classes = {low: 'notice', medium: 'warn', high: 'critical'}
const levels = ['low', 'medium', 'high']
const getHighestLevel = outdated =>
  outdated.reduce((acc, pkg) => Math.max(acc, levels.indexOf(pkg.severity)), 0)

class UpdateNotifier extends Component {
  state = {}

  componentDidMount() {
    VersionChecker.checkVersions()
      .then(this.handleVersionReply)
      .catch(logError)
  }

  handleVersionReply = ({result}) => {
    const {isSupported, isUpToDate, outdated} = result
    const level = levels[getHighestLevel(outdated || [])]
    this.setState({isSupported, isUpToDate, level, outdated})
  }

  handleShowUpdateNotifier = () => {
    this.setState({showUpdateNotifier: true})
  }

  handleHideUpdateNotifier = () => {
    this.setState({showUpdateNotifier: false})
  }

  render() {
    const {level, outdated, isUpToDate, isSupported, showUpdateNotifier} = this.state
    const severity = isSupported ? level : 'high'
    const className = styles[classes[severity] || 'button']
    const Dialog = isUpToDate ? CurrentVersionsDialog : UpdateNotifierDialog

    return (
      <div className={styles.root}>
        {showUpdateNotifier && (
          <Dialog severity={severity} outdated={outdated} onClose={this.handleHideUpdateNotifier} />
        )}

        <a onClick={this.handleShowUpdateNotifier} className={className}>
          <strong>Sanity Studio</strong>{' '}
          {!isUpToDate && (
            <div className={styles.warningIcon}>
              <WarningIcon />
            </div>
          )}
          <span className={isUpToDate ? styles.upToDateText : styles.upgradeText}>
            {isUpToDate ? 'Up to date' : 'Upgrade'}
          </span>
        </a>
      </div>
    )
  }
}

export default UpdateNotifier
