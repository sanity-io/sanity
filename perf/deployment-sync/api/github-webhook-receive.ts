import {VercelRequest, VercelResponse} from '@vercel/node'
import {getEnv} from '../utils/getEnv'
import {verifyGithubSignature} from '../utils/verifySignature'
import {sanityIdify} from '../utils/sanityIdSafe'
import {studioMetricsClient} from '../utils/sanityClient'

const secret = process.env.NODE_ENV === 'development' ? '' : getEnv('GITHUB_WEBHOOK_SECRET')

/*
 * deployment notifications from github webhook
 * Configure here: https://github.com/sanity-io/sanity/settings/hooks/403045587
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  if (process.env.NODE_ENV !== 'development' && !(await verifyGithubSignature(secret, req))) {
    res.status(400).end('Invalid signature. Request did not originate from GitHub')
    return
  }

  const event = req.headers['x-github-event']
  if (event !== 'create' && event !== 'delete' && event !== 'push') {
    res.status(200)
    res.send('Currently only "create" and "delete" events are handled')
    return
  }

  const payload = req.body

  if (payload.ref_type === 'branch') {
    const doc = {
      _id: `branch-${sanityIdify(payload.ref)}`,
      _type: 'branch',
    }
    await studioMetricsClient
      .transaction()
      .createIfNotExists(doc)
      .patch(doc._id, (p) =>
        p.set({name: payload.ref}).setIfMissing({
          base: payload.master_branch,
          createdBy: payload.sender.login,
        })
      )
      .patch(doc._id, (p) => p.set({deleted: event === 'delete'}))
      .commit({visibility: 'async', tag: 'perf.github.branch'})
    res.status(200)
    res.end('ok')

    return
  }

  if (payload.ref_type === 'tag') {
    // soo, github doesn't send the sha of the commit the tag is pointing to, so we need to fetch it
    const tags: {name: string; commit: {sha: string}}[] = await (
      await fetch(`https://api.github.com/repos/${payload.repository.full_name}/tags`)
    ).json()

    const tag = tags.find((t) => t.name === payload.ref)
    const doc = {
      _id: `tag-${sanityIdify(payload.ref)}`,
      _type: 'tag',
    }
    await studioMetricsClient
      .transaction()
      .createIfNotExists(doc)
      .patch(doc._id, (p) =>
        p.set({name: payload.ref}).setIfMissing({
          base: payload.master_branch,
          createdBy: payload.sender.login,
          commit: tag?.commit.sha,
        })
      )
      .patch(doc._id, (p) => p.set({deleted: event === 'delete'}))
      .commit({visibility: 'async', tag: 'perf.github.tag'})
    res.status(200)
    res.end('ok')

    return
  }

  if (event === 'push' && payload.head_commit) {
    // The full git ref that was pushed. Example: refs/heads/main or refs/tags/v3.14.1.
    const branchName = payload.ref.replace('refs/heads/', '').replace('refs/tags/', '')

    const doc = {
      _id: `branch-${sanityIdify(branchName)}`,
      _type: 'branch',
    }
    await studioMetricsClient
      .transaction()
      .createIfNotExists(doc)
      .patch(doc._id, (p) =>
        p
          .set({
            name: branchName,
            'lastCommit.sha': payload.head_commit.id,
            'lastCommit.message': payload.head_commit.message,
            'lastCommit.author': payload.head_commit.author.name,
            'lastCommit.user': payload.head_commit.author.username,
          })
          .setIfMissing({
            base: payload.repository.master_branch,
            createdBy: payload.sender.login,
          })
      )
      .patch(doc._id, (p) => p.set({deleted: payload.deleted}))
      .commit({visibility: 'async', tag: 'perf.github.branch'})
    res.status(200)
    res.end('ok')
  }
}
