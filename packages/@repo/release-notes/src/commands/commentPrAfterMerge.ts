/* oxlint-disable no-console */
import {type RestEndpointMethodTypes} from '@octokit/rest'

import {REPO} from '../constants'
import {octokit} from '../octokit'
import {getMergedPRForCommit} from '../utils/github'
import {getSanityDocumentIdsForBaseVersion} from '../utils/ids'
import {markdownToPortableText} from '../utils/portabletext-markdown/markdownToPortableText'
import {extractReleaseNotes, shouldExcludeReleaseNotes} from '../utils/pullRequestReleaseNotes'

const INTERNAL_ASSOCIATIONS = ['MEMBER', 'OWNER']

export async function commentPrAfterMerge(options: {
  commit: string
  baseVersion: string
  adminStudioBaseUrl: string
}) {
  const pr = await getMergedPRForCommit('sanity-io', 'sanity', options.commit)
  if (!pr) {
    throw new Error('No PR found for this commit')
  }

  console.log(`Found PR #${pr.number}`)

  // Get PR details including reviewers
  const {data: pullRequest} = await octokit.rest.pulls.get({
    ...REPO,
    // eslint-disable-next-line camelcase
    pull_number: pr.number,
  })
  if (!pullRequest) {
    return
  }

  // skip the reminder comment if the PR description explicitly states "no release notes needed"
  const skipReminder = pullRequest.body
    ? shouldExcludeReleaseNotes(extractReleaseNotes(markdownToPortableText(pullRequest.body)))
    : false

  if (skipReminder) {
    console.log(`PR #${pr.number} explicitly states no notes for release is required, skipping.`)
    return
  }

  const collaborators = await getCollaborators(pullRequest)

  const {releaseId, changelogDocumentId} = getSanityDocumentIdsForBaseVersion(options.baseVersion)

  const entryKey = options.commit.slice(0, 8)
  const entryPath = encodeURIComponent(`changelog[_key=="${entryKey}"]`)
  const changelogEntryUrl = `${options.adminStudioBaseUrl}/intent/edit/id=${changelogDocumentId.published};path=${entryPath}/?perspective=${releaseId}`

  const authorIsBot = collaborators.author.type === 'Bot'

  // Create comment
  const commentBody = `A **[:scroll: Release note](${changelogEntryUrl})** has been created for this PR.

${
  collaborators.isExternalContribution || authorIsBot
    ? `${collaborators.approvers.map((approver) => mention(approver)).join(', ')} as reviewer${collaborators.approvers.length > 1 ? 's' : ''} of this PR, please take a look and make sure it includes all the relevant details.`
    : `Please take a look and make sure it includes all the relevant details.`
}


${authorIsBot ? '`*beep boop*`' : `Thanks for your contribution, ${mention(collaborators.author)}! 🎉`}`

  await createOrUpdateComment({commit: options.commit, pr: pr.number, body: commentBody})
}

async function createOrUpdateComment(options: {commit: string; pr: number; body: string}) {
  const idempotencyMarker = `[idempotency-key]:#release-notes-reminder\n`

  const {data: existingComments} = await octokit.rest.issues.listComments({
    ...REPO,
    // eslint-disable-next-line camelcase
    issue_number: options.pr,
    // eslint-disable-next-line camelcase
    per_page: 100,
    order: 'created',
    direction: 'desc',
  })

  const existingComment = existingComments.find(
    (comment) => comment.body && comment.body?.includes(idempotencyMarker),
  )

  if (existingComment && existingComment.body) {
    // check if there are any changes
    const withoutMarker = existingComment.body.replace(idempotencyMarker, '')
    if (withoutMarker === options.body) {
      console.log('Comment is unchanged. Nothing to do')
      return Promise.resolve()
    }
    return octokit.rest.issues.updateComment({
      ...REPO,
      // eslint-disable-next-line camelcase
      comment_id: existingComment.id,
      body: idempotencyMarker + options.body,
    })
  }

  return octokit.rest.issues.createComment({
    ...REPO,
    // eslint-disable-next-line camelcase
    issue_number: options.pr,
    body: idempotencyMarker + options.body,
  })
}

type PullRequest = RestEndpointMethodTypes['pulls']['get']['response']['data']
/**
 * Retrieves information about collaborators involved in a pull request.
 *
 * @param pullRequest - The pull request object containing details about the PR.
 * @returns An object containing:
 * - author: The user who created the pull request.
 * - external: A boolean indicating if the author is external to the organization.
 * - approvers: An array of users who have approved the pull request and belong to the internal associations.
 */
async function getCollaborators(pullRequest: PullRequest) {
  const author = pullRequest.user
  const isExternalContribution = !INTERNAL_ASSOCIATIONS.includes(pullRequest.author_association)

  // Get reviews to find reviewers
  const {data: reviews} = await octokit.rest.pulls.listReviews({
    ...REPO,
    // eslint-disable-next-line camelcase
    pull_number: pullRequest.number,
  })
  const approvers = reviews
    .filter((review) => {
      return (
        review.state === 'APPROVED' &&
        INTERNAL_ASSOCIATIONS.includes(review.author_association) &&
        review.user?.type === 'User'
      )
    })
    .map((review) => review.user)
    .filter((approver) => !!approver)

  return {
    isExternalContribution,
    author,
    approvers: uniqueBy(approvers, (approver) => approver.login),
  }
}
/**
 * Returns a new array with unique items, keyed by `keyFn`.
 * Keeps the FIRST item encountered for each key and preserves input order.
 */
export function uniqueBy<T, K>(items: readonly T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>()
  const out: T[] = []
  for (const item of items) {
    const key = keyFn(item)
    if (!seen.has(key)) {
      seen.add(key)
      out.push(item)
    }
  }

  return out
}

function mention(user: PullRequest['user']) {
  if (user.type !== 'Bot') {
    return `@${user.login}`
  }
  return user.login
}
