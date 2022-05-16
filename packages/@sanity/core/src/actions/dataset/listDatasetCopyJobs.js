import {parseISO, formatDistanceToNow, formatDistance} from 'date-fns'

module.exports = async function listDatasetCopyJobs(args, context) {
  const {apiClient, output, chalk} = context
  const flags = args.extOptions
  const client = apiClient()
  const projectId = client.config().projectId
  const query = {}
  let response

  if (flags.offset && flags.offset >= 0) {
    query.offset = flags.offset
  }
  if (flags.limit && flags.limit > 0) {
    query.limit = flags.limit
  }

  try {
    response = await client.request({
      method: 'GET',
      uri: `/projects/${projectId}/datasets/copy`,
      query,
    })
  } catch (error) {
    if (error.statusCode) {
      output.error(`${chalk.red(`Dataset copy list failed:\n${error.response.body.message}`)}\n`)
    } else {
      output.print(`${chalk.red(`Dataset copy list failed:\n${error.message}`)}\n`)
    }
  }

  if (response && response.length > 0) {
    output.print('Dataset copy jobs for this project:')
    const print = []

    response.forEach((job) => {
      const {id, state, createdAt, updatedAt, sourceDataset, targetDataset, withHistory} = job

      let timeStarted = ''
      if (createdAt !== '') {
        timeStarted = formatDistanceToNow(parseISO(createdAt))
      }

      let timeTaken = ''
      if (updatedAt !== '') {
        timeTaken = formatDistance(parseISO(updatedAt), parseISO(createdAt))
      }

      print.push({
        'Job ID': id,
        State: state,
        History: withHistory,
        'Time started': timeStarted === '' ? '' : `${timeStarted} ago`,
        'Time taken': timeTaken,
        'Source dataset': sourceDataset,
        'Target dataset': targetDataset,
      })
    })

    output.table(print, [
      'Job ID',
      'Source dataset',
      'Target dataset',
      'State',
      'History',
      'Time started',
      'Time taken',
    ])
  } else {
    output.print("This project doesn't have any dataset copy jobs")
  }
}
