// oxlint-disable no-console
import {ConventionalGitClient} from '@conventional-changelog/git-client'
import {MONOREPO_ROOT} from '@repo/utils'
import {type SanityClient, ClientError} from '@sanity/client'
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

import {getClient} from '../client'
import {STUDIO_PLATFORM_DOCUMENT_ID} from '../constants'
import {type PullRequestInfo, type StudioChangelogEntry} from '../types'
import {getCommits, getSemverTags} from '../utils/getCommits'
import {getMergedPRForCommit} from '../utils/github'
import {getSanityDocumentIdsForBaseVersion} from '../utils/ids'
import {parseRenovateReleaseNotes} from '../utils/parseRenovateReleaseNotes'
import {
  markdownToPortableText,
  type NormalizedMarkdownBlock,
} from '../utils/portabletext-markdown/markdownToPortableText'
import {extractReleaseNotes, shouldExcludeReleaseNotes} from '../utils/pullRequestReleaseNotes'
import {stripPr} from '../utils/stripPrNumber'
import {uploadImages} from '../utils/uploadImages'

export async function createOrUpdateChangelogDocs(args: {
  tentativeVersion?: string
  baseVersion: string
  dryRun?: boolean
}) {
  const {tentativeVersion, baseVersion, dryRun} = args
  const client = getClient()

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
    client,
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
      ...(await mergeChangelogBody(client, changelogDocumentId.version, commitsWithPrs, {dryRun})),
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

  if (dryRun) {
    console.log('[DRY RUN] UPDATE CHANGELOG')
    console.log(JSON.stringify(mutations, null, 0))
  } else {
    await client.transaction(SanityEncoder.encodeAll(mutations)).commit()
  }

  return {success: true, changelogDocumentId, apiVersionDocId, commitsWithPrs, releaseId}
}

async function toArray<T>(it: AsyncIterableIterator<T>): Promise<T[]> {
  const result: T[] = []
  for await (const chunk of it) {
    result.push(chunk)
  }
  return result
}

async function mergeChangelogBody(
  client: SanityClient,
  id: string,
  entries: PullRequestInfo[],
  {dryRun}: {dryRun?: boolean},
) {
  const currentDocument = (await client.getDocument(id)) || {}
  const changelogEntryPatches = await pMap(entries, async (entry) =>
    createEntry(client, entry, {dryRun}),
  )
  const updated = applyPatches(
    [at('changelog', setIfMissing([])), ...changelogEntryPatches.flat()],
    currentDocument,
  )

  return [at('changelog', set(updated.changelog.filter(Boolean)))]
}

function createEntry(client: SanityClient, info: PullRequestInfo, {dryRun}: {dryRun?: boolean}) {
  return info.pr && info.pr.body ? getReleaseNotesMutations(client, info, {dryRun}) : []
}

async function getReleaseNotesMutations(
  client: SanityClient,
  {pr, conventionalCommit}: PullRequestInfo,
  options: {dryRun?: boolean},
) {
  const cleanSubject = pr
    ? stripPr(conventionalCommit.subject || '', pr.number)
    : conventionalCommit.subject || ''

  // get the link to an entry: ;path=changelog%5B_key%3D%3D%22b470e3b5%22%5D.subject/?perspective=rstudio-1000
  const userType = pr?.user?.type?.toLowerCase()
  const isBot = userType === 'bot'

  const releaseNoteBlocks = pr?.body
    ? isBot
      ? parseRenovateReleaseNotes(pr.body)
      : extractReleaseNotes(markdownToPortableText(pr.body))
    : []

  const excludeReleaseNotes =
    shouldExcludeReleaseNotes(releaseNoteBlocks) ||
    (isBot && releaseNoteBlocks.length === 0) ||
    conventionalCommit.type === 'chore' ||
    conventionalCommit.type === 'test' ||
    conventionalCommit.scope === 'dev' ||
    conventionalCommit.scope === 'build' ||
    conventionalCommit.scope === 'test'

  const entry: StudioChangelogEntry = {
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
    exclude: excludeReleaseNotes,
    subject: cleanSubject,
    header: conventionalCommit.header || '',
    coAuthors: conventionalCommit.body ? descriptionToCoAuthors(conventionalCommit.body) : [],
    scope: conventionalCommit.scope || undefined,
    hash: conventionalCommit.hash || undefined,
    type: conventionalCommit.type || undefined,
    contents: excludeReleaseNotes
      ? []
      : ((await uploadImages(client, releaseNoteBlocks, {
          dryRun: options.dryRun,
        })) as NormalizedMarkdownBlock[]),
  }

  return [at('changelog', insertIfMissing(entry, 'before', 0))]
}

async function ensureContentRelease(
  client: SanityClient,
  id: string,
  title: string,
  description: string,
) {
  const created = await client.releases
    .create({
      releaseId: id,
    })
    .then(
      () => true,
      (err: unknown) => {
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
