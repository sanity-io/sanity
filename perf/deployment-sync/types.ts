type DeploymentType = 'deployment' | 'deployment-error' | 'deployment-ready'
/**
 * https://vercel.com/docs/integrations#webhooks/events
 */
interface VercelWebhookEvent<Type extends DeploymentType, Payload> {
  id: string // event id,
  type: Type
  clientId: string
  createdAt: number
  payload: Payload
  ownerId: string // e.g team_xyz
  teamId: string // e.g team_xyz
  userId: string
  webhookId: string
}

export type VercelDeploymentCreatedEvent = VercelWebhookEvent<
  'deployment',
  DeploymentCreatedPayload
>
export type VercelDeploymentErrorEvent = VercelWebhookEvent<
  'deployment-error',
  DeploymentErrorPayload
>
export type VercelDeploymentReadyEvent = VercelWebhookEvent<
  'deployment-ready',
  DeploymentReadyPayload
>

// todo: convert to zod and validate json payload
interface DeploymentMetadata {
  githubCommitAuthorName: string //"Bjørge Næss"
  githubCommitMessage: string //"refactor(form-builder): sort out fieldset/focus conundrum"
  githubCommitOrg: string //"sanity-io"
  githubCommitRef: string //"ui/ch1976/migrate-objectinput-to-ui"
  githubCommitRepo: string //"sanity"
  githubCommitRepoId: string //"79375056"
  githubCommitSha: string //"7eba5de73c6fa7a317f87d66a1dd4a727415296c"
  githubDeployment: string //"1"
  githubOrg: string //"sanity-io"
  githubRepo: string //"sanity"
  githubRepoId: string //"79375056"
  githubCommitAuthorLogin: string //"bjoerge"
}

interface DeploymentInfo {
  id: string //"dpl_2sMLCV4CJcLtQJsqikD62WQMBqAX"
  meta: DeploymentMetadata
  name: string //"test-studio"
  url: string //"test-studio-fafktd7wk.sanity.build"
  inspectorUrl: string //"https://vercel.com/sanity-io/test-studio/2sMLCV4CJcLtQJsqikD62WQMBqAX"
}

export interface DeploymentCreatedPayload {
  alias: string[] // ["test-studio-git-ui-ch7680poc-slots-based-formfield-an-e03a15.sanity.build"]
  deployment: DeploymentInfo
  projectId: string //"QmeDcdj9ZnrZmMNpvfextJTfz37x7DWHgdLb6HNdcyVT2i"
  plan: string //"enterprise"
  regions: string[] // ["sfo1"]
}

interface DeploymentReadyPayload {
  deployment: DeploymentInfo
  projectId: string //"QmeDcdj9ZnrZmMNpvfextJTfz37x7DWHgdLb6HNdcyVT2i"
  plan: string //"enterprise"
  regions: string[] // ["sfo1"]
}

export interface DeploymentErrorPayload {
  deployment: DeploymentInfo
  projectId: string //"QmeDcdj9ZnrZmMNpvfextJTfz37x7DWHgdLb6HNdcyVT2i"
  plan: string //"enterprise"
  regions: string[] // ["sfo1"]
}

export type VercelDeploymentEvent =
  | VercelDeploymentCreatedEvent
  | VercelDeploymentReadyEvent
  | VercelDeploymentErrorEvent
