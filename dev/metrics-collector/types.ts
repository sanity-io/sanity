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

export interface DeploymentCreatedPayload {
  alias: string[] // ["test-studio-git-ui-ch7680poc-slots-based-formfield-an-e03a15.sanity.build"]
  deployment: {
    id: string //"dpl_2sMLCV4CJcLtQJsqikD62WQMBqAX"
    meta: DeploymentMetadata
    name: string //"test-studio"
    url: string //"test-studio-fafktd7wk.sanity.build"
    inspectorUrl: string //"https://vercel.com/sanity-io/test-studio/2sMLCV4CJcLtQJsqikD62WQMBqAX"
  }
  deploymentId: string //"dpl_2sMLCV4CJcLtQJsqikD62WQMBqAX"
  name: string //"test-studio"
  plan: string //"enterprise"
  project: string //"QmeDcdj9ZnrZmMNpvfextJTfz37x7DWHgdLb6HNdcyVT2i"
  projectId: string //"QmeDcdj9ZnrZmMNpvfextJTfz37x7DWHgdLb6HNdcyVT2i"
  regions: string[] // ["sfo1"]
  type: string //"LAMBDAS"
  url: string //"test-studio-fafktd7wk.sanity.build"
}

export interface DeploymentCreatedMessage {
  id: string //"774oval4PQ9S_-wi"
  type: 'deployment'
  clientId: string //"oac_LwKmuGQsyFtoLcQi5M6dgbqC"
  createdAt: number
  payload: DeploymentCreatedPayload
  ownerId: string //"team_oqU06TUi6OGH315dQZ2wFh08"
  teamId: string //"team_oqU06TUi6OGH315dQZ2wFh08"
  userId: string //"Ggtx0MfDKNBFIaMd9GHjGw0A"
  webhookId: string //"hook_36922e4d346b11dbe52431334b86e5b71eaac858"
}

interface DeploymentReadyPayload {
  deployment: {
    id: string //"dpl_2sMLCV4CJcLtQJsqikD62WQMBqAX"
    meta: DeploymentMetadata
    name: string //"test-studio"
    url: string //"test-studio-fafktd7wk.sanity.build"
    inspectorUrl: string //"https://vercel.com/sanity-io/test-studio/2sMLCV4CJcLtQJsqikD62WQMBqAX"
  }
  deploymentId: string //"dpl_2sMLCV4CJcLtQJsqikD62WQMBqAX"
  name: string //"test-studio"
  plan: string //"enterprise"
  project: string //"QmeDcdj9ZnrZmMNpvfextJTfz37x7DWHgdLb6HNdcyVT2i"
  projectId: string //"QmeDcdj9ZnrZmMNpvfextJTfz37x7DWHgdLb6HNdcyVT2i"
  regions: string[] // ["sfo1"]
  type: string //"LAMBDAS"
  url: string //"test-studio-fafktd7wk.sanity.build"
}

export interface DeploymentReadyMessage {
  id: string //"774oval4PQ9S_-wi"
  type: 'deployment-ready'
  clientId: string //"oac_LwKmuGQsyFtoLcQi5M6dgbqC"
  createdAt: number
  payload: DeploymentReadyPayload
  ownerId: string //"team_oqU06TUi6OGH315dQZ2wFh08"
  teamId: string //"team_oqU06TUi6OGH315dQZ2wFh08"
  userId: string //"Ggtx0MfDKNBFIaMd9GHjGw0A"
  webhookId: string //"hook_36922e4d346b11dbe52431334b86e5b71eaac858"
}

export type DeploymentMessage = DeploymentCreatedMessage | DeploymentReadyMessage

declare const m: DeploymentMessage
