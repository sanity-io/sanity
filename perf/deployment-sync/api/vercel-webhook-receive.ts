import {VercelRequest, VercelResponse} from '@vercel/node'
import {VercelDeploymentEvent} from '../types'
import {sanityIdify} from '../utils/sanityIdSafe'
import {studioMetricsClient} from '../utils/sanityClient'
import {getEnv} from '../utils/getEnv'
import {verifySignature} from '../utils/verifySignature'

const MONOREPO_PROJECTS = ['test-studio', 'perf-studio']
const secret = getEnv('WEBHOOK_SECRET')
/*
 * deployment notifications from Vercel webhook
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  const message: VercelDeploymentEvent = req.body

  if (process.env.NODE_ENV !== 'development' && !(await verifySignature(secret, req))) {
    res.status(400).end('Invalid signature')
    return
  }

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
    url: `https://${payload.deployment.url}`,
    inspectorUrl: payload.deployment.inspectorUrl,
  }

  studioMetricsClient
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
