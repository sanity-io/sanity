import {ConventionalGitClient} from '@conventional-changelog/git-client'
import {MONOREPO_ROOT} from '@repo/utils'
import {ClientError} from '@sanity/client'
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
import {format} from 'date-fns/format'
import {descriptionToCoAuthors} from 'description-to-co-authors'
import pMap from 'p-map'

import {client} from '../client'
import {STUDIO_PLATFORM_DOCUMENT_ID} from '../constants'
import {type PullRequestInfo} from '../types'
import {getCommits, getSemverTags} from '../utils/getCommits'
import {getMergedPRForCommit} from '../utils/github'
import {getSanityDocumentIdsForBaseVersion} from '../utils/ids'
import {markdownToPortableText} from '../utils/portabletext-markdown/markdownToPortableText'
import {extractReleaseNotes} from '../utils/pullRequestReleaseNotes'
import {stripPr} from '../utils/stripPrNumber'
import {uploadImages} from '../utils/uploadImages'

export async function createOrUpdateChangelogDocs(args: {
  tentativeVersion?: string
  baseVersion: string
}) {
  const {tentativeVersion, baseVersion} = args

  // We obfuscate the base version id so we can use in the changelog document ids
  // Without obfuscating, the document id for the changelog document would include the
  // previous (base) version, which would likely be confusing
  const gitClient = new ConventionalGitClient(MONOREPO_ROOT)

  const commits = getCommits(gitClient, await getSemverTags(gitClient), {
    branch: 'main',
    releaseCount: 1,
  })
  const allCommits = await toArray(commits)

  const commitsWithPrs = await fetchCommitPrs(allCommits)

  const {releaseId, changelogDocumentId, apiVersionDocId} =
    getSanityDocumentIdsForBaseVersion(baseVersion)

  await ensureContentRelease(
    releaseId,
    `Studio release v${tentativeVersion}`,
    `Content release for the upcoming Studio release (tentatively v${tentativeVersion})`,
  )

  const mutations = [
    // make sure the platform document exists
    // this is idempotent and will only create the document if it doesn't already exist
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
      at('releaseAutomation', setIfMissing({})),
      at('releaseAutomation.tentativeVersion', set(tentativeVersion)),
      at('releaseAutomation.source', set('studio')),
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
  const changelogEntryPatches = await pMap(entries, async (entry) => createEntry(entry))
  const updated = applyPatches(
    [at('changelog', setIfMissing([])), ...changelogEntryPatches.flat()],
    currentDocument,
  )

  return [at('changelog', set(updated.changelog.filter(Boolean)))]
}

function createEntry(info: PullRequestInfo) {
  return info.pr && info.pr.body ? getReleaseNotesMutations(info) : []
}

async function getReleaseNotesMutations({pr, conventionalCommit}: PullRequestInfo) {
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
    header: conventionalCommit.header || '',
    coAuthors: conventionalCommit.body ? descriptionToCoAuthors(conventionalCommit.body) : [],
    scope: conventionalCommit.scope,
    hash: conventionalCommit.hash,
    type: conventionalCommit.type,
    contents:
      pr && pr.body
        ? await uploadImages(client, extractReleaseNotes(markdownToPortableText(pr.body)))
        : cleanSubject,
  }
  return [at('changelog', insertIfMissing(entry, 'before', 0))]
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
          err.response?.body?.error?.type === 'documentAlreadyExistsError'
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
