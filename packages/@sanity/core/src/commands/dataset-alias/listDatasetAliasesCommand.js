import {sortBy, size} from 'lodash'

const sortFields = ['alias', 'dataset']

export default {
  name: 'list',
  group: 'dataset-alias',
  signature: '',
  description: 'List dataset aliases of your project',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context
    const {sort, order} = {
      sort: 'alias',
      order: 'asc',
      ...args.extOptions
    }

    if (!sortFields.includes(sort)) {
      throw new Error(`Can't sort by field "${sort}". Must be one of ${sortFields.join(', ')}`)
    }

    const client = apiClient()
    const aliases = await client.datasetAliases.list()

    const ordered = sortBy(
      aliases.map(({name, datasetName}) => {
        const dn = datasetName ? datasetName : '<unlinked>'
        return [name, dn]
      }),
      [sortFields.indexOf(sort)]
    )

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
