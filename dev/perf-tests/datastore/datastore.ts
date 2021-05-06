import {nanoid} from 'nanoid'
import {sanityClient} from './sanityClient'

interface Report {
  hardwareProfile: {_id: string; _type: 'hardwareProfile'}
  summary: {_id: string; _type: 'testResult'}
  perfRun: {_id: string, _type: 'perfRun'}
}

export function submitReport(result: Report) {
  return sanityClient
    .transaction()
    .createIfNotExists(result.hardwareProfile)
    .createIfNotExists(result.summary)
    .patch(result.summary._id, (p) =>
      p
        .setIfMissing({runs: []})
        .insert('before', 'runs[0]', [
          {
            _key: `run-${nanoid(16)}`,
            _type: 'reference',
            _ref: result.perfRun._id,
          },
        ])
        .unset(['runs[200:]'])
    )
    .create(result.perfRun)
    .commit()
}
