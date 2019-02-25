import React from 'react'
import sanityClient from 'part:@sanity/base/client'
import Spinner from 'part:@sanity/components/loading/spinner'
import styles from './ProjectUsers.css'
import ProjectUser from './ProjectUser'

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

    if (!project || !users) {
      return <Spinner />
    }

    if (error) {
      return <pre>{JSON.stringify(error, null, 2)}</pre>
    }

    return (
      <div className={styles.container}>
        <h2>Project Users</h2>
        <ul>
          {users.sort(this.sortUsersByRobotStatus).map(user => {
            const membership = project.members.find(member => member.id === user.id)
            return <ProjectUser key={user.id} user={user} membership={membership} />
          })}
        </ul>
        <div>
          <a href={getInviteUrl(project.id)} target="_blank" rel="noopener noreferrer">
            Invite members
          </a>
        </div>
      </div>
    )
  }
}

export default {
  name: 'project-users',
  component: ProjectUsers
}
