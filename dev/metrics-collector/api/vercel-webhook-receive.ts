import * as http from 'http'
import {VercelApiHandler, VercelRequest, VercelResponse} from '@vercel/node'
import {DeploymentCreatedPayload, DeploymentMessage} from '../types'
import {sanityClient} from '../utils/sanityClient'
import {nanoid} from 'nanoid'
import {sanityIdify} from '../utils/sanityIdSafe'

const INCLUDE_PROJECTS = ['test-studio', 'perf-studio']
/*
 * deployment notifications from Vercel webhook
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  const message: DeploymentMessage = req.body


  if (!INCLUDE_PROJECTS.includes(message.payload.name)) {
    console.log('ignoring project: %s', message.payload.name)
    res.status(200)
    res.end('ok')
    return
  }

  console.log(message)

  const branchDoc = {
    _id: `branch-${sanityIdify(message.payload.deployment.meta.githubCommitRef)}`,
    _type: 'gitBranch',
    name: message.payload.deployment.meta.githubCommitRef,
  }

  const deployment = {
    _id: `deployment-${sanityIdify(message.payload.deploymentId)}`,
    _type: 'deployment',
    deploymentId: message.payload.deploymentId,
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
