import {ConventionalGitClient} from '@conventional-changelog/git-client'
import {markdownToPortableText} from '@portabletext/markdown'
import {MONOREPO_ROOT} from '@repo/utils'
import {ClientError} from '@sanity/client'
import {createPublishedId, getDraftId, getVersionId} from '@sanity/id-utils'
import {
  at,
  createIfNotExists,
  insertIfMissing,
  patch,
  SanityEncoder,
  set,
  setIfMissing,
} from '@sanity/mutate'
import {applyPatches} from '@sanity/mutate/_unstable_apply'
import {type Commit} from 'conventional-commits-parser'
import {format} from 'date-fns'
import pMap from 'p-map'

import {client} from '../client'
import {STUDIO_PLATFORM_DOCUMENT_ID} from '../constants'
import {octokit} from '../octokit'
import {type PullRequestInfo} from '../types'
import {extractReleaseNotes} from '../utils/extractReleaseNotes'
import {getCommits, getSemverTags} from '../utils/getCommits'
import {stripPr} from '../utils/stripPrNumber'

const createId = (releaseId: string, input: string) => {
  const published = createPublishedId(input)
  return {published, version: getVersionId(published, releaseId), draft: getDraftId(published)}
}

export async function createOrUpdateChangelogDocs(args: {
  tentativeVersion?: string
  baseVersion: string
}) {
  const {tentativeVersion, baseVersion} = args

  // We obfuscate the base version id so we can use in the changelog document ids
  // Without obfuscating, the document id for the changelog document would include the
  // previous (base) version, which would likely be confusing
  const baseVersionId = Buffer.from(baseVersion).toString('base64url')
  const gitClient = new ConventionalGitClient(MONOREPO_ROOT)

  const commits = getCommits(gitClient, await getSemverTags(gitClient), {
    branch: 'main',
    releaseCount: 1,
  })
  const allCommits = await toArray(commits)

  const commitsWithPrs = await fetchCommitPrs(allCommits)

  const releaseId = `rstudio-${baseVersionId}`

  const changelogDocumentId = createId(releaseId, `studio-${baseVersionId}`)
  const apiVersionDocId = createId(releaseId, `${changelogDocumentId.published}-api-version`)

  await ensureContentRelease(
    releaseId,
    `Studio release v${tentativeVersion}`,
    `Content release for the upcoming Studio release (tentatively v${tentativeVersion})`,
  )

  const mutations = [
    createIfNotExists({
      _id: STUDIO_PLATFORM_DOCUMENT_ID,
      _type: 'apiPlatform',
      title: 'Sanity Studio',
      npmName: 'sanity',
    }),
    createIfNotExists({
      _id: changelogDocumentId.version,
      _type: 'apiChange',
    }),
    createIfNotExists({
      _id: apiVersionDocId.version,
      _type: 'apiVersion',
    }),
    patch(apiVersionDocId.version, [
      at(
        'platform',
        set({
          _ref: STUDIO_PLATFORM_DOCUMENT_ID,
          _type: 'reference',
        }),
      ),
      at('semver', set(tentativeVersion)),
    ]),
    patch(apiVersionDocId.version, [at('date', set(format(new Date(), 'yyyy-MM-dd')))]),
    patch(changelogDocumentId.version, [
      at('title', setIfMissing(tentativeVersion)),
      ...(await mergeChangelogBody(changelogDocumentId.version, commitsWithPrs)),
      at('publishedAt', set(new Date())),
      at(
        'version',
        set({
          _type: 'reference',
          _ref: apiVersionDocId.published,
        }),
      ),
    ]),
  ]

  await client.transaction(SanityEncoder.encodeAll(mutations)).commit()

  return {success: true, changelogDocumentId, apiVersionDocId, commitsWithPrs, releaseId}
}

export async function toArray<T>(it: AsyncIterableIterator<T>): Promise<T[]> {
  const result: T[] = []
  for await (const chunk of it) {
    result.push(chunk)
  }
  return result
}

async function mergeChangelogBody(id: string, entries: PullRequestInfo[]) {
  const currentDocument = (await client.getDocument(id)) || {}
  const updated = applyPatches(
    [
      at('changelog', set([])),
      ...(entries.length > 0 ? entries.flatMap((c, i) => createEntry(c)) : []),
    ],
    currentDocument,
  )

  return [at('changelog', set(updated.changelog.filter(Boolean)))]
}

function createEntry(info: PullRequestInfo) {
  return info.pr && info.pr.body ? getReleaseNotesMutations(info) : []
}

function getReleaseNotesMutations({pr, conventionalCommit}: PullRequestInfo) {
  const cleanSubject = pr
    ? stripPr(conventionalCommit.subject || '', pr.number)
    : conventionalCommit.subject || ''

  // get the link to an entry: ;path=changelog%5B_key%3D%3D%22b470e3b5%22%5D.subject/?perspective=rstudio-1000
  const userType = pr?.user?.type?.toLowerCase()
  const entry = {
    _type: 'changelogEntry',
    _key: conventionalCommit.hash!.slice(0, 8),
    pr: pr?.number,
    author:
      pr && pr.user
        ? {
            username: pr.user?.login,
            url: pr.user?.html_url,
            imageUrl: pr.user.avatar_url,
            type: userType,
          }
        : undefined,
    authorAssociation: pr?.author_association.toLowerCase(),
    exclude:
      // are there ever cases where we want to show release notes from bot PRs?
      userType === 'bot' ||
      conventionalCommit.type === 'chore' ||
      conventionalCommit.type === 'test' ||
      conventionalCommit.scope === 'dev' ||
      conventionalCommit.scope === 'build' ||
      conventionalCommit.scope === 'test',
    subject: cleanSubject,
    scope: conventionalCommit.scope,
    hash: conventionalCommit.hash,
    type: conventionalCommit.type,
    contents:
      pr && pr.body
        ? extractReleaseNotes(
            markdownToPortableText(pr.body).filter((b) => b._type !== 'horizontal-rule'),
          )
        : cleanSubject,
  }
  return [at('changelog', insertIfMissing(entry, 'after', -1))]
}

async function ensureContentRelease(id: string, title: string, description: string) {
  const created = await client.releases
    .create({
      releaseId: id,
    })
    .then(
      () => true,
      (err) => {
        if (
          err instanceof ClientError &&
          err.statusCode === 409 &&
          err.response.body.error.type === 'documentAlreadyExistsError'
        ) {
          return false
        }
        throw err
      },
    )

  await client.releases.edit({
    releaseId: id,
    patch: {
      set: {
        'metadata.title': title,
        'metadata.description': description,
      },
    },
  })

  return {created}
}

async function fetchCommitPrs(commits: Commit[]) {
  return pMap(
    commits,
    async (commit) => {
      const pr = await getMergedPRForCommit('sanity-io', 'sanity', commit.hash!)
      return {conventionalCommit: commit, pr}
    },
    {concurrency: 4},
  )
}

async function getMergedPRForCommit(owner: string, repo: string, commitSha: string) {
  // Get PRs associated with the commit
  // see https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
  const {data: prs} = await octokit.repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    // eslint-disable-next-line camelcase
    commit_sha: commitSha,
  })

  // Find the merged PR (if any)
  return prs.find((pr) => pr.merged_at !== null)
}
