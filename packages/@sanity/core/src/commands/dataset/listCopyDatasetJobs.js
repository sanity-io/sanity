import lazyRequire from '@sanity/util/lib/lazyRequire'

const helpText = `
    Options
        --offset Start position in the list of jobs. Default 0.
        --limit Maximum number of jobs returned. Default 10. Maximum 1000.

    Examples
        sanity dataset copy list
        sanity dataset copy list --offset=2
        sanity dataset copy list --offset=2 --limit=10

    Returns table of jobs with:
    - jobId
    - current state - pending, completed, failed, terminating, terminated
    - History - whether or not dataset copy included document history
    - time started - when the job was started
    - time taken - the amount of time the job took to finish
    - source - source dataset name
    - target - target dataset name
`

export default {
  name: 'jobs',
  signature: 'list',
  group: 'dataset',
  description: 'Lists all dataset copy jobs corresponding to a certain criteria',
  action: lazyRequire(require.resolve('../../actions/dataset/listDatasetCopyJobs')),
  helpText,
}
