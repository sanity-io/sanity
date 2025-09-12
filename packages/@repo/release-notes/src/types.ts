import {type RestEndpointMethodTypes} from '@octokit/rest'

export type KnownEnvVar =
  | 'RELEASE_NOTES_SANITY_DATASET'
  | 'RELEASE_NOTES_SANITY_PROJECT_ID'
  | 'RELEASE_NOTES_SANITY_TOKEN'
  | 'RELEASE_NOTES_SANITY_TOKEN'
  | 'GITHUB_TOKEN'

export type PullRequest =
  RestEndpointMethodTypes['repos']['listPullRequestsAssociatedWithCommit']['response']['data'][number]
