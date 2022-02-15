import {size, sortBy} from 'lodash'
import type {CliCommandDefinition} from '../../types'

const headings = ['id', 'members', 'name', 'url', 'created']
const helpText = `
Options
  --sort <field> Sort output by specified column
  --order <asc/desc> Sort output ascending/descending

Examples
  # List projects
  sanity projects list

  # List projects sorted by member count, ascending
  sanity projects list --sort=members --order=asc
`

const defaultFlags = {
  sort: 'created',
  order: 'desc',
}

const listProjectsCommand: CliCommandDefinition = {
  name: 'list',
  group: 'projects',
  signature: '',
  helpText,
  description: 'Lists projects connected to your user',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context
    const flags = {...defaultFlags, ...args.extOptions}
    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })

    const projects = await client.projects.list()
    const ordered = sortBy(
      projects.map(({displayName, id, members = [], studioHost = '', createdAt}) => {
        const studio = studioHost ? `https://${studioHost}.sanity.studio` : 'Not deployed'
        return [id, members.length, displayName, studio, createdAt].map(String)
      }),
      [headings.indexOf(flags.sort)]
    )

    const rows = flags.order === 'asc' ? ordered : ordered.reverse()

    const maxWidths = rows.reduce(
      (max, row) => row.map((current, index) => Math.max(size(current), max[index])),
      headings.map((str) => size(str))
    )

    const printRow = (row: string[]) =>
      row.map((col, i) => `${col}`.padEnd(maxWidths[i])).join('   ')

    output.print(chalk.cyan(printRow(headings)))
    rows.forEach((row) => output.print(printRow(row)))
  },
}

export default listProjectsCommand
