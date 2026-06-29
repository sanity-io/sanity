import {type RestEndpointMethodTypes} from '@octokit/rest'
import {type Commit} from 'conventional-commits-parser'
import {type CoAuthor} from 'description-to-co-authors'

import {type NormalizedMarkdownBlock} from './utils/portabletext-markdown/markdownToPortableText'

export type KnownEnvVar =
  | 'RELEASE_NOTES_SANITY_DATASET'
  | 'RELEASE_NOTES_SANITY_PROJECT_ID'
  | 'RELEASE_NOTES_SANITY_TOKEN'
  | 'RELEASE_NOTES_CLAUDE_API_KEY'
  | 'RELEASE_NOTES_ADMIN_STUDIO_URL'
  | 'GITHUB_TOKEN'

export type PullRequest =
  | RestEndpointMethodTypes['repos']['listPullRequestsAssociatedWithCommit']['response']['data'][number]
  | RestEndpointMethodTypes['pulls']['get']['response']['data']

export type CommitAuthor = NonNullable<
  RestEndpointMethodTypes['repos']['getCommit']['response']['data']['author']
>

export type PullRequestInfo = {
  pr?: PullRequest
  commitAuthor?: CommitAuthor
  conventionalCommit: Commit
}

export type StudioChangelogEntry = {
  _key: string
  _type: string
  author?: {
    imageUrl?: string
    type?: string
    url: string
    username: string
  }
  coAuthors: CoAuthor[]
  authorAssociation?: string
  exclude: boolean
  breaking?: boolean
  hash?: string
  pr?: number
  contents: NormalizedMarkdownBlock[]
  scope?: string
  subject: string
  header: string
  type?: string
}
