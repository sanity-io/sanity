const Table = require('tty-table')

export default {
  name: 'list',
  group: 'projects',
  signature: '',
  description: 'Lists projects connected to your user',
  action: async (args, context) => {
    const {apiClient, output} = context
    const client = apiClient({
      requireUser: true,
      requireProject: false
    })
    const projects = await client.request({
      method: 'GET',
      uri: '/projects'
    })
    const maxWidth = col => projects.reduce((max, current) => Math.max(current[col].length, max), 0)
    const rows = projects.map(({displayName, id, members = [], studioHost = ''}) => {
      const studio = studioHost ? `https://${studioHost}.sanity.studio` : 'Not deployed'
      const row = [id, members.length, displayName, studio]
      return row
    })
    const table = new Table(
      ['id', 'members #', 'name', 'url'].map(value => ({
        value,
        align: 'left',
        headerColor: 'green'
      })),
      rows
    )

    output.print(table.render())
  }
}
