import * as http from 'http'
import {VercelApiHandler, VercelRequest, VercelResponse} from '@vercel/node'
import {DeploymentCreatedPayload, DeploymentMessage} from '../types'
import {sanityClient} from '../utils/sanityClient'
import {nanoid} from 'nanoid'
import {sanityIdify} from '../utils/sanityIdSafe'
/*
 * deployment notifications from Vercel webhook
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  const message: DeploymentMessage = JSON.parse(req.body)

  const branchDoc = {
    _id: `${sanityIdify(
      message.payload.deployment.name,
      message.payload.deployment.meta.githubCommitRef
    )}`,
    _type: 'gitBranch',
    name: message.payload.deployment.meta.githubCommitRef,
  }

  const buildDoc = {
    _id: `${sanityIdify('vercel-build', message.payload.deployment.id)}`,
    _type: 'vercelBuild',
    deploymentId: message.payload.deploymentId,
    meta: message.payload.deployment.meta,
    name: message.payload.deployment.name,
    url: message.payload.deployment.url,
    inspectorUrl: message.payload.deployment.inspectorUrl,
  }

  sanityClient
    .transaction()
    .createIfNotExists(branchDoc)
    .createIfNotExists(buildDoc)
    .patch(buildDoc._id, (p) =>
      p.set({status: message.type === 'deployment' ? 'pending' : 'ready'})
    )
    .commit()
}
