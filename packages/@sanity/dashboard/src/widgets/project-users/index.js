import React from 'react'
import sanityClient from 'part:@sanity/base/client'
import Spinner from 'part:@sanity/components/loading/spinner'
import styles from './index.css'
import DefaultPreview from 'part:@sanity/components/previews/default'
import {List, Item} from 'part:@sanity/components/lists/default'
import AnchorButton from 'part:@sanity/components/buttons/anchor'
import ToolIcon from 'react-icons/lib/go/tools'

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

  componentDidMount = () => {
    const {projectId} = sanityClient.clientConfig
    // fetch project data
    sanityClient.projects
      .getById(projectId)
      .then(project => {
        this.setState({project})
        sanityClient.users
          .getById(project.members.map(mem => mem.id).join(','))
          .then(users => this.setState({users}))
      })
      .catch(error => this.setState({error}))
  }

  render() {
    const {error, project, users} = this.state

    const isLoading = !project || !users

    if (error) {
      return <pre>{JSON.stringify(error, null, 2)}</pre>
    }

    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Project Users</h1>
        <List className={styles.list}>
          {isLoading && <Spinner center />}
          {!isLoading &&
            users.sort(this.sortUsersByRobotStatus).map(user => {
              const membership = project.members.find(member => member.id === user.id)
              const media = membership.isRobot ? (
                <ToolIcon className={styles.profileImage} />
              ) : (
                <img src={user.imageUrl} className={styles.avatar} />
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

export default {
  name: 'project-users',
  component: ProjectUsers
}
