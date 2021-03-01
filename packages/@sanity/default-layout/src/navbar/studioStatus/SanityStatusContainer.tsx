import React from 'react'
import {of} from 'rxjs'
import {flatMap, catchError} from 'rxjs/operators'
import userStore from 'part:@sanity/base/user'
import {withPropsStream} from 'react-props-stream'
import VersionChecker from 'part:@sanity/base/version-checker'
import versions from 'sanity:versions'
import SanityStatus from '../studioStatus/SanityStatus'
import {Package, Severity} from './types'

interface Props {
  showStatus: boolean
  versionReply: {outdated?: Package[]; isSupported: boolean; isUpToDate: boolean}
}

const levels: Array<Severity> = ['low', 'medium', 'high']

const getHighestLevel = (outdated: Package[]) =>
  outdated.reduce((acc, pkg) => Math.max(acc, levels.indexOf(pkg.severity)), 0)

class SanityStatusContainer extends React.PureComponent<Props> {
  state = {
    showDialog: false,
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

    const {outdated, isSupported, isUpToDate} = this.props.versionReply
    const level = levels[getHighestLevel(outdated || [])]

    return (
      <SanityStatus
        isSupported={isSupported}
        isUpToDate={isUpToDate}
        level={level}
        showDialog={this.state.showDialog}
        onHideDialog={this.handleHideDialog}
        onShowDialog={this.handleShowDialog}
        outdated={outdated}
        versions={versions}
      />
    )
  }
}

interface UserEvent {
  user?: {
    role: 'administrator'
  }
}

export default withPropsStream(
  userStore.currentUser.pipe(
    flatMap(((event: UserEvent) => {
      if (event.user && event.user.role === 'administrator') {
        return VersionChecker.checkVersions().then(({result}) => ({
          versionReply: result,
          showStatus: true,
        }))
      }

      return {showStatus: false}
    }) as any),
    catchError((err) => of({error: err, showStatus: false}))
  ),
  SanityStatusContainer
)
