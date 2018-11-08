import React from 'react'
import VersionChecker from 'part:@sanity/base/version-checker'
import versions from 'sanity:versions'
import SanityStatus from './SanityStatus'

// eslint-disable-next-line no-console
const logError = err => console.error(err)
const levels = ['low', 'medium', 'high']
const getHighestLevel = outdated =>
  outdated.reduce((acc, pkg) => Math.max(acc, levels.indexOf(pkg.severity)), 0)

class SanityStatusContainer extends React.PureComponent {
  state = {
    isSupported: true,
    isUpToDate: true,
    level: 'low',
    outdated: undefined,
    showDialog: false
  }

  componentDidMount() {
    VersionChecker.checkVersions()
      .then(this.handleVersionReply)
      .catch(logError)
  }

  handleHideDialog = () => {
    this.setState({showDialog: false})
  }

  handleShowDialog = () => {
    this.setState({showDialog: true})
  }

  handleVersionReply = ({result}) => {
    const {isSupported, isUpToDate, outdated} = result
    const level = levels[getHighestLevel(outdated || [])]
    this.setState({isSupported, isUpToDate, level, outdated})
  }

  render() {
    return (
      <SanityStatus
        {...this.state}
        onHideDialog={this.handleHideDialog}
        onShowDialog={this.handleShowDialog}
        versions={versions}
      />
    )
  }
}

export default SanityStatusContainer
