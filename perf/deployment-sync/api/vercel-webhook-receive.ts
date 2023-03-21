import {VercelRequest, VercelResponse} from '@vercel/node'
import {VercelDeploymentEvent} from '../types'
import {sanityIdify} from '../utils/sanityIdSafe'
import {studioMetricsClient} from '../utils/sanityClient'
import {getEnv} from '../utils/getEnv'
import {verifyVercelSignature} from '../utils/verifySignature'

const MONOREPO_DEPLOYMENTS = ['test-studio', 'performance-studio']
const secret = process.env.NODE_ENV === 'development' ? '' : getEnv('VERCEL_WEBHOOK_SECRET')
/*
 * deployment notifications from Vercel webhook
 * Configured here: https://vercel.com/teams/sanity-io/settings/webhooks
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  const message: VercelDeploymentEvent = req.body

  if (process.env.NODE_ENV !== 'development' && !(await verifyVercelSignature(secret, req))) {
    res.status(400).end('Invalid signature')
    return
  }

  const {type, payload} = message
  if (!MONOREPO_DEPLOYMENTS.includes(payload.deployment.name)) {
    res.status(200)
    res.end('ok')
    return
  }

  const branchDoc = {
    _id: `branch-${sanityIdify(payload.deployment.meta.githubCommitRef)}`,
    _type: 'branch',
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
    url: `https://${payload.deployment.url}`,
    inspectorUrl: payload.deployment.inspectorUrl,
  }

  studioMetricsClient
    .transaction()
    .createIfNotExists(branchDoc)
    .patch(branchDoc._id, (p) =>
      p.setIfMissing({
        name: payload.deployment.meta.githubCommitRef,
        lastCommit: {
          author: payload.deployment.meta.githubCommitAuthorName,
          message: payload.deployment.meta.githubCommitMessage,
          sha: payload.deployment.meta.githubCommitSha,
          user: payload.deployment.meta.githubCommitAuthorLogin,
        },
      })
    )
    .createOrReplace(deployment)
    .patch(deployment._id, (p) =>
      p.set({
        status: type.split('.')[1],
      })
    )
    .commit({visibility: 'async', tag: 'perf.vercel.deployment'})
    .then(() => {
      res.status(200)
      res.end('ok')
    })
}
