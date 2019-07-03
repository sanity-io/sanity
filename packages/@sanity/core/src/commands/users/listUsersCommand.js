import {sortBy, size} from 'lodash'

const sortFields = ['id', 'name', 'role', 'date']

const helpText = `
Options
  --no-invitations Don't include pending invitations
  --no-robots Don't include robots (token users)
  --sort <field> Sort users by specified column: ${sortFields.join(', ')}
  --order <asc/desc> Sort output ascending/descending

Examples
  # List all users of the project
  sanity users list

  # List all users of the project, but exclude pending invitations and robots
  sanity users list --no-invitations --no-robots

  # List all users, sorted by role
  sanity users list --sort role
`

export default {
  name: 'list',
  group: 'users',
  signature: '',
  helpText,
  description: 'List all users of the project',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context
    const {sort, order, robots, invitations} = {
      sort: 'date',
      order: 'asc',
      robots: true,
      invitations: true,
      ...args.extOptions
    }

    if (!sortFields.includes(sort)) {
      throw new Error(`Can't sort by field "${sort}". Must be one of ${sortFields.join(', ')}`)
    }

    if (order !== 'asc' && order !== 'desc') {
      throw new Error(`Unknown sort order "${order}", must be either "asc" or "desc"`)
    }

    const client = apiClient()
    const globalClient = client.clone().config({useProjectHostname: false})
    const {projectId} = client.config()

    const useGlobalApi = true
    const [pendingInvitations, project] = await Promise.all([
      invitations
        ? globalClient
            .request({uri: `/invitations/project/${projectId}`, useGlobalApi})
            .then(getPendingInvitations)
        : [],
      globalClient.request({uri: `/projects/${projectId}`, useGlobalApi})
    ])

    const memberIds = project.members.map(member => member.id)
    const users = await globalClient
      .request({uri: `/users/${memberIds.join(',')}`, useGlobalApi})
      .then(arrayify)

    const members = project.members
      .map(member => ({
        ...member,
        ...getUserProps(users.find(candidate => candidate.id === member.id))
      }))
      .filter(member => !member.isRobot || robots)
      .concat(pendingInvitations)

    const ordered = sortBy(members.map(({id, name, role, date}) => [id, name, role, date]), [
      sortFields.indexOf(sort)
    ])

    const rows = order === 'asc' ? ordered : ordered.reverse()

    const maxWidths = rows.reduce(
      (max, row) => row.map((current, index) => Math.max(size(current), max[index])),
      sortFields.map(str => size(str))
    )

    const printRow = row => {
      const isInvite = row[0] === '<pending>'
      const textRow = row.map((col, i) => `${col}`.padEnd(maxWidths[i])).join('   ')
      return isInvite ? chalk.dim(textRow) : textRow
    }

    output.print(chalk.cyan(printRow(sortFields)))
    rows.forEach(row => output.print(printRow(row)))
  }
}

function arrayify(obj) {
  return Array.isArray(obj) ? obj : [obj]
}

function getUserProps(user) {
  const {displayName: name, createdAt: date} = user || {}
  return {name, date}
}

function getPendingInvitations(invitations) {
  return invitations
    .filter(invite => !invite.isAccepted && !invite.isRevoked && !invite.acceptedByUserId)
    .map(invite => ({
      id: '<pending>',
      name: invite.email,
      role: invite.role,
      date: invite.createdAt
    }))
}
