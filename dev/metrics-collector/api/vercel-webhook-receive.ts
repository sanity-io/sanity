import * as http from 'http'
import {VercelApiHandler, VercelRequest, VercelResponse} from '@vercel/node'
import {DeploymentCreatedPayload, DeploymentMessage} from '../types'
import {sanityClient} from '../utils/sanityClient'
import {nanoid} from 'nanoid'
import {sanityIdify} from '../utils/sanityIdSafe'

const MONOREPO_PROJECTS = ['test-studio', 'perf-studio']
/*
 * deployment notifications from Vercel webhook
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  const message: DeploymentMessage = req.body

  if (!MONOREPO_PROJECTS.includes(message.payload.name)) {
    console.log('ignoring project: %s', message.payload.name)
    res.status(200)
    res.end('ok')
    return
  }

  console.log(JSON.stringify(message))

  const branchDoc = {
    _id: `branch-${sanityIdify(message.payload.deployment.meta.githubCommitRef)}`,
    _type: 'branch',
    name: message.payload.deployment.meta.githubCommitRef,
    lastCommit: {
      author: message.payload.deployment.meta.githubCommitAuthorName,
      message: message.payload.deployment.meta.githubCommitMessage,
      sha: message.payload.deployment.meta.githubCommitSha,
      user: message.payload.deployment.meta.githubCommitAuthorLogin,
    },
  }

  const deployment = {
    _id: `deployment-${sanityIdify(message.payload.deploymentId)}`,
    _type: 'deployment',
    deploymentId: message.payload.deploymentId,
    branch: {
      _type: 'reference',
      _ref: branchDoc._id,
    },
    meta: message.payload.deployment.meta,
    name: message.payload.name,
    url: message.payload.deployment.url,
    inspectorUrl: message.payload.deployment.inspectorUrl,
  }

  sanityClient
    .transaction()
    .createOrReplace(branchDoc)
    .createOrReplace(deployment)
    .patch(deployment._id, (p) =>
      p.set({status: message.type === 'deployment' ? 'pending' : 'ready'})
    )
    .commit()
    .then(() => {
      res.status(200)
      res.end('ok')
    })
}
