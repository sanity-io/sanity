import {VercelRequest, VercelResponse} from '@vercel/node'
import {VercelDeploymentEvent} from '../types'
import {sanityClient} from '../utils/sanityClient'
import {sanityIdify} from '../utils/sanityIdSafe'

const MONOREPO_PROJECTS = ['test-studio', 'perf-studio']
/*
 * deployment notifications from Vercel webhook
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  const message: VercelDeploymentEvent = req.body

  const {type, payload} = message
  if (!MONOREPO_PROJECTS.includes(payload.deployment.name)) {
    console.log('ignoring project: %s', payload.deployment.name)
    res.status(200)
    res.end('ok')
    return
  }

  console.log(JSON.stringify(message))

  const branchDoc = {
    _id: `branch-${sanityIdify(payload.deployment.meta.githubCommitRef)}`,
    _type: 'branch',
    name: payload.deployment.meta.githubCommitRef,
    lastCommit: {
      author: payload.deployment.meta.githubCommitAuthorName,
      message: payload.deployment.meta.githubCommitMessage,
      sha: payload.deployment.meta.githubCommitSha,
      user: payload.deployment.meta.githubCommitAuthorLogin,
    },
  }

  const deployment = {
    _id: `deployment-${sanityIdify(payload.deployment.id)}`,
    _type: 'deployment',
    deploymentId: payload.deployment.id,
    branch: {
      _type: 'reference',
      _ref: branchDoc._id,
    },
    meta: payload.deployment.meta,
    name: payload.deployment.name,
    url: payload.deployment.url,
    inspectorUrl: payload.deployment.inspectorUrl,
  }

  sanityClient
    .transaction()
    .createOrReplace(branchDoc)
    .createOrReplace(deployment)
    .patch(deployment._id, (p) =>
      p.set({
        status: type === 'deployment' ? 'pending' : type === 'deployment-error' ? 'error' : 'ready',
      })
    )
    .commit()
    .then(() => {
      res.status(200)
      res.end('ok')
    })
}
