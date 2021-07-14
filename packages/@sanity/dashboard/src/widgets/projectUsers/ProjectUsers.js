import React from 'react'
import {map, switchMap} from 'rxjs/operators'
import {Stack, Spinner, Card, Box, Text, Button} from '@sanity/ui'
import {RobotIcon} from '@sanity/icons'
import styled from 'styled-components'
import {versionedClient} from '../../versionedClient'
import {DashboardWidget} from '../../DashboardTool'
import {DefaultPreview, userStore} from '../../legacyParts'

const AvatarWrapper = styled(Card)`
  box-sizing: border-box;
  border-radius: 50%;
  border-color: transparent;
  overflow: hidden;
  width: 100%;
  height: 100%;

  & > img {
    width: 100%;
    height: auto;
  }
`

function getInviteUrl(projectId) {
  return `https://manage.sanity.io/projects/${projectId}/team/invite`
}

function sortUsersByRobotStatus(userA, userB, project) {
  const {members} = project
  const membershipA = members.find((member) => member.id === userA.id)
  const membershipB = members.find((member) => member.id === userB.id)
  if (membershipA.isRobot) {
    return 1
  }
  if (membershipB.isRobot) {
    return -1
  }
  return 0
}

class ProjectUsers extends React.PureComponent {
  static propTypes = {}
  static defaultProps = {}

  state = {
    project: null,
    users: null,
    error: null,
  }

  componentDidMount() {
    this.fetchData()
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  fetchData() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }

    const {projectId} = versionedClient.config()
    this.subscription = versionedClient.observable
      .request({
        uri: `/projects/${projectId}`,
      })
      .pipe(
        switchMap((project) =>
          userStore.observable
            .getUsers(project.members.map((mem) => mem.id))
            .pipe(map((users) => ({project, users})))
        )
      )
      .subscribe({
        next: ({users, project}) =>
          this.setState({
            project,
            users: (Array.isArray(users) ? users : [users]).sort((userA, userB) =>
              sortUsersByRobotStatus(userA, userB, project)
            ),
          }),
        error: (error) => this.setState({error}),
      })
  }

  handleRetryFetch = () => {
    this.fetchData()
  }

  render() {
    const {error, project, users} = this.state
    const isLoading = !users || !project

    if (error) {
      return (
        <DashboardWidget header="Project users">
          <Box padding={4}>
            <Text>
              Something went wrong while fetching data. You could{' '}
              <a
                onClick={this.handleRetryFetch}
                title="Retry users fetch"
                style={{cursor: 'pointer'}}
              >
                retry
              </a>
              ..?
            </Text>
          </Box>
        </DashboardWidget>
      )
    }

    return (
      <DashboardWidget
        header="Project users"
        footer={
          <Button
            style={{width: '100%'}}
            paddingX={2}
            paddingY={4}
            mode="bleed"
            tone="primary"
            text="Invite members"
            as="a"
            loading={isLoading}
            href={isLoading ? undefined : getInviteUrl(project.id)}
          />
        }
      >
        {isLoading && (
          <Box paddingY={5} paddingX={2}>
            <Stack space={4}>
              <Text align="center" muted size={1}>
                <Spinner />
              </Text>
              <Text align="center" size={1} muted>
                Loading items...
              </Text>
            </Stack>
          </Box>
        )}

        {!isLoading && (
          <Stack space={3} padding={3}>
            {users.map((user) => {
              const membership = project.members.find((member) => member.id === user.id)
              const media = membership.isRobot ? (
                <Text size={3}>
                  <RobotIcon />
                </Text>
              ) : (
                <AvatarWrapper tone="transparent">
                  {user?.imageUrl && <img src={user.imageUrl} alt={user?.displayName} />}
                </AvatarWrapper>
              )
              return (
                <Box key={user.id}>
                  <DefaultPreview
                    title={user.displayName}
                    subtitle={membership.role}
                    media={media}
                  />
                </Box>
              )
            })}
          </Stack>
        )}
      </DashboardWidget>
    )
  }
}

export default ProjectUsers
