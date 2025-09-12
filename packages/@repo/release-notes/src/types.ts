import {type RestEndpointMethodTypes} from '@octokit/rest'
import {type Commit} from 'conventional-commits-parser'

export type KnownEnvVar =
  | 'RELEASE_NOTES_SANITY_DATASET'
  | 'RELEASE_NOTES_SANITY_PROJECT_ID'
  | 'RELEASE_NOTES_SANITY_TOKEN'
  | 'RELEASE_NOTES_ADMIN_STUDIO_URL'
  | 'GITHUB_TOKEN'

export type PullRequest =
  RestEndpointMethodTypes['repos']['listPullRequestsAssociatedWithCommit']['response']['data'][number]

export type PullRequestInfo = {
  pr?: PullRequest
  conventionalCommit: Commit
}
