import React from 'react'
import {of} from 'rxjs'
import {flatMap, catchError} from 'rxjs/operators'
import userStore from 'part:@sanity/base/user'
import {withPropsStream} from 'react-props-stream'
import VersionChecker from 'part:@sanity/base/version-checker'
import versions from 'sanity:versions'
import SanityStatus from './SanityStatus'

// eslint-disable-next-line no-console
const levels = ['low', 'medium', 'high']
const getHighestLevel = outdated =>
  outdated.reduce((acc, pkg) => Math.max(acc, levels.indexOf(pkg.severity)), 0)

class SanityStatusContainer extends React.PureComponent {
  state = {
    showDialog: false
  }

  handleHideDialog = () => {
    this.setState({showDialog: false})
  }

  handleShowDialog = () => {
    this.setState({showDialog: true})
  }

  render() {
    if (!this.props.showStatus) {
      return null
    }

    const {outdated} = this.props.versionReply
    const level = levels[getHighestLevel(outdated || [])]
    return (
      <SanityStatus
        {...this.props.versionReply}
        level={level}
        showDialog={this.state.showDialog}
        onHideDialog={this.handleHideDialog}
        onShowDialog={this.handleShowDialog}
        versions={versions}
      />
    )
  }
}

export default withPropsStream(
  userStore.currentUser.pipe(
    flatMap(event =>
      event.user && event.user.role === 'administrator'
        ? VersionChecker.checkVersions().then(({result}) => ({
            versionReply: result,
            showStatus: true
          }))
        : {showStatus: false}
    ),
    catchError(err => of({error: err, showStatus: false}))
  ),
  SanityStatusContainer
)
