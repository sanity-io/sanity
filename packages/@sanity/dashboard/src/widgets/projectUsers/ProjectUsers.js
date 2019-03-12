import React from 'react'
import sanityClient from 'part:@sanity/base/client'
import Spinner from 'part:@sanity/components/loading/spinner'
import DefaultPreview from 'part:@sanity/components/previews/default'
import {List, Item} from 'part:@sanity/components/lists/default'
import AnchorButton from 'part:@sanity/components/buttons/anchor'
import ToolIcon from 'react-icons/lib/go/tools'
import styles from './ProjectUsers.css'

function getInviteUrl(projectId) {
  return `https://manage.sanity.io/projects/${projectId}/team/invite`
}

class ProjectUsers extends React.Component {
  static propTypes = {}
  static defaultProps = {}

  state = {
    project: null,
    users: null,
    error: null
  }

  sortUsersByRobotStatus = (userA, userB) => {
    const {members} = this.state.project
    const membershipA = members.find(member => member.id === userA.id)
    const membershipB = members.find(member => member.id === userB.id)
    if (membershipA.isRobot) {
      return 1
    }
    if (membershipB.isRobot) {
      return -1
    }
    return 0
  }

  componentDidMount() {
    this.fetchData()
  }

  fetchData() {
    const {projectId} = sanityClient.config()
    sanityClient.projects
      .getById(projectId)
      .then(project => {
        this.setState({project})
        return project
      })
      .then(project => sanityClient.users.getById(project.members.map(mem => mem.id).join(',')))
      .then(users => this.setState({users: Array.isArray(users) ? users : [users]}))
      .catch(error => this.setState({error}))
  }

  handleRetryFetch = () => {
    this.fetchData()
  }

  render() {
    const {error, project, users} = this.state
    const isLoading = !users || !project

    if (error) {
      return (
        <div>
          Something went wrong while fetching data. You could{' '}
          <a className={styles.retry} onClick={this.handleRetryFetch} title="Retry users fetch">
            retry
          </a>
          ..?
        </div>
      )
    }

    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>Project users</h2>
        </header>

        {isLoading && (
          <List className={styles.list}>
            <Spinner center message="Loading items…" />
          </List>
        )}

        {!isLoading && (
          <List className={styles.list}>
            {users.sort(this.sortUsersByRobotStatus).map(user => {
              const membership = project.members.find(member => member.id === user.id)
              const media = membership.isRobot ? (
                <ToolIcon className={styles.profileImage} />
              ) : (
                <div className={styles.avatar}>
                  {user.imageUrl && <img src={user.imageUrl} alt={user.displayName} />}
                </div>
              )
              return (
                <Item key={user.id} className={styles.item}>
                  <DefaultPreview
                    title={user.displayName}
                    subtitle={membership.role}
                    media={media}
                  />
                </Item>
              )
            })}
          </List>
        )}

        <div className={styles.buttonContainer}>
          <AnchorButton
            disabled={isLoading}
            href={isLoading ? undefined : getInviteUrl(project.id)}
            bleed
            color="primary"
            kind="simple"
          >
            Invite members
          </AnchorButton>
        </div>
      </div>
    )
  }
}

export default ProjectUsers
