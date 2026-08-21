/**
 * Pure parsing for the git-history sync (no I/O — see syncGitHistory.ts for
 * the shell): turn `git log` / `git for-each-ref` output into `gitCommit` and
 * `gitTag` documents with deterministic ids, so every sync run can
 * `createOrReplace` the same window idempotently.
 *
 * Field delimiters are control characters (unit/record separators), not `|`
 * or newlines: commit subjects can contain any printable character, and git
 * permits `|` even in refnames. A record with the wrong field count throws —
 * mis-attributing author to subject silently would poison the dataset.
 */

/** `git log --format=` value producing one \x1e-terminated record per commit. */
export const COMMIT_LOG_FORMAT = '%H%x1f%an%x1f%ae%x1f%aI%x1f%cI%x1f%s%x1f%P%x1e'

/**
 * `git for-each-ref refs/tags --format=` value; %(*objectname) is the
 * dereferenced commit for annotated tags. `lstrip=2` (not `:short`): short
 * names disambiguate against same-named branches — a branch called v5.0.1
 * makes the tag print as `tags/v5.0.1`, which would silently fail the semver
 * match.
 */
export const TAG_REF_FORMAT =
  '%(refname:lstrip=2)%1f%(creatordate:iso-strict)%1f%(*objectname)%1f%(objectname)'

/**
 * Tags below this major are not ingested: the dataset covers v5.0.0 onward
 * (the same cutoff the backfill uses for commits), and the strict semver
 * match already drops junk refs (backup/*, test-tag, per-package tags).
 */
export const MIN_TAG_MAJOR = 5

const FIELD_SEPARATOR = '\x1f'
const RECORD_SEPARATOR = '\x1e'

/** Strict `vMAJOR.MINOR.PATCH[-prerelease]` — anything else is not a release tag. */
const SEMVER_TAG_RE = /^v(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/

export interface CommitInfo {
  sha: string
  authorName: string
  authorEmail: string
  authoredAt: string
  committedAt: string
  subject: string
  /** First parent — the linear mainline chain link. Absent on a root commit. */
  parentSha?: string
}

export interface TagInfo {
  tag: string
  taggedAt: string
  /** Dereferenced commit sha (annotated tags point at a tag object first). */
  sha: string
  major: number
  minor: number
  patch: number
  prerelease?: string
}

export interface GitCommitDocument {
  _id: string
  _type: 'gitCommit'
  schemaVersion: number
  sha: string
  /** First-parent sha — the linear mainline chain link (Bisect walks it). */
  parentSha?: string
  authorName: string
  authorEmail: string
  authoredAt: string
  committedAt: string
  subject: string
  commitType?: string
  scope?: string
  breaking?: boolean
  prNumber?: number
  /**
   * Immutable Vercel deploy of dev/test-studio built at this commit — not set
   * by commitDocument(); syncGitHistory.ts merges it in from GitHub
   * deployment statuses (see githubDeployments.ts).
   */
  testStudioUrl?: string
  /**
   * GitHub account the author email maps to — also merged in by
   * syncGitHistory.ts (the studio derives real avatars from it, which
   * gravatar can't do for noreply/unregistered emails).
   */
  authorLogin?: string
  /**
   * GitHub's own avatar URL for that account — collected because it cannot
   * be derived: bot avatars live under /in/<app-id>, not /u/<user-id>.
   */
  authorAvatarUrl?: string
}

export interface GitTagDocument {
  _id: string
  _type: 'gitTag'
  schemaVersion: number
  tag: string
  sha: string
  /**
   * npm registry enrichment — not set by tagDocument(); syncGitHistory.ts
   * merges it in on npm-collecting runs (see npmVersions.ts).
   */
  npm?: {publishedAt?: string; distTags?: string[]; weeklyDownloads?: number}
  /** Weak: the commit may be off-main (release-branch tags) or not ingested yet. */
  commit: {_type: 'reference'; _ref: string; _weak: true}
  taggedAt: string
  major: number
  minor: number
  patch: number
  prerelease?: string
}

export function parseCommitRecords(raw: string): CommitInfo[] {
  return raw
    .split(RECORD_SEPARATOR)
    .map((record) => record.trim())
    .filter((record) => record.length > 0)
    .map((record) => {
      const fields = record.split(FIELD_SEPARATOR)
      if (fields.length !== 7) {
        throw new Error(
          `Malformed commit record (${fields.length} fields, expected 7): ${JSON.stringify(record)}`,
        )
      }
      const [sha, authorName, authorEmail, authoredAt, committedAt, subject, parents] = fields
      // %P is space-separated parent shas; the first parent is the mainline
      // link. Empty on a root commit.
      const parentSha = parents.split(' ')[0] || undefined
      return {
        sha,
        authorName,
        authorEmail,
        authoredAt,
        committedAt,
        subject,
        ...(parentSha ? {parentSha} : {}),
      }
    })
}

/**
 * Best-effort conventional-commit parse — only ~half the history conforms
 * (older commits predate the convention), so a non-match is `{}`, not an
 * error, and the raw subject is always stored alongside.
 */
export function parseConventionalSubject(subject: string): {
  commitType?: string
  scope?: string
  breaking?: boolean
} {
  const match = /^(\w+)(?:\(([^)]*)\))?(!)?:\s/.exec(subject)
  if (!match) return {}
  const [, commitType, scope, breaking] = match
  return {
    commitType,
    ...(scope ? {scope} : {}),
    ...(breaking ? {breaking: true} : {}),
  }
}

/** PR number from a squash-merge subject's trailing `(#1234)` — mid-subject mentions don't count. */
export function parsePrNumber(subject: string): number | undefined {
  const match = /\(#(\d+)\)\s*$/.exec(subject)
  return match ? Number(match[1]) : undefined
}

/**
 * Parse `for-each-ref` output down to release tags: strict semver match plus
 * the major cutoff. Junk refs are filtered, but a structurally broken record
 * still throws (same fail-loud stance as commits).
 */
export function parseTagRefs(raw: string): TagInfo[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      const fields = line.split(FIELD_SEPARATOR)
      if (fields.length !== 4) {
        throw new Error(
          `Malformed tag record (${fields.length} fields, expected 4): ${JSON.stringify(line)}`,
        )
      }
      const [tag, taggedAt, dereferencedSha, objectSha] = fields
      const match = SEMVER_TAG_RE.exec(tag)
      if (!match) return []
      const [, major, minor, patch, prerelease] = match
      if (Number(major) < MIN_TAG_MAJOR) return []
      return [
        {
          tag,
          taggedAt,
          // Annotated tags dereference to their commit; lightweight tags ARE the commit.
          sha: dereferencedSha || objectSha,
          major: Number(major),
          minor: Number(minor),
          patch: Number(patch),
          ...(prerelease ? {prerelease} : {}),
        },
      ]
    })
}

export function commitDocumentId(sha: string): string {
  return `gitCommit-${sha}`
}

export function commitDocument(info: CommitInfo): GitCommitDocument {
  const {commitType, scope, breaking} = parseConventionalSubject(info.subject)
  const prNumber = parsePrNumber(info.subject)
  return {
    _id: commitDocumentId(info.sha),
    _type: 'gitCommit',
    schemaVersion: 1,
    sha: info.sha,
    ...(info.parentSha ? {parentSha: info.parentSha} : {}),
    authorName: info.authorName,
    authorEmail: info.authorEmail,
    authoredAt: info.authoredAt,
    committedAt: info.committedAt,
    subject: info.subject,
    ...(commitType ? {commitType} : {}),
    ...(scope ? {scope} : {}),
    ...(breaking ? {breaking} : {}),
    ...(typeof prNumber === 'number' ? {prNumber} : {}),
  }
}

export function tagDocument(info: TagInfo): GitTagDocument {
  return {
    // Note: dots in ids are path segments to Sanity (invisible to
    // unauthenticated queries) — fine here, every reader authenticates
    _id: `gitTag-${info.tag}`,
    _type: 'gitTag',
    schemaVersion: 1,
    tag: info.tag,
    sha: info.sha,
    commit: {_type: 'reference', _ref: commitDocumentId(info.sha), _weak: true},
    taggedAt: info.taggedAt,
    major: info.major,
    minor: info.minor,
    patch: info.patch,
    ...(info.prerelease ? {prerelease: info.prerelease} : {}),
  }
}

export interface GitHubCollection {
  /** Resolved enrichment per sha (deploy URL, author login). */
  info: Map<string, {testStudioUrl?: string; authorLogin?: string; authorAvatarUrl?: string}>
  /**
   * Shas whose GraphQL batch succeeded. A sha outside this set was NOT
   * queried (in practice: GITHUB_TOKEN missing — API errors abort the run
   * instead) — writing it would ERASE previously stored enrichment, since
   * the sync replaces whole documents.
   */
  queriedShas: Set<string>
}

/**
 * Decide what a sync run actually writes — pure, so the erasure rules are
 * testable:
 * - commits whose GitHub lookup didn't run are OMITTED (idempotency makes
 *   omission free; the next successful run covers them)
 * - tags are written only on npm-collecting runs: a tag upsert without npm
 *   data would clobber the enrichment, and every event that can introduce a
 *   tag collects npm (tag pushes, the daily cron, dispatches)
 */
export function assembleSyncDocuments(input: {
  commits: GitCommitDocument[]
  tags: GitTagDocument[]
  github: GitHubCollection
  /** Present only on npm-collecting runs. */
  npmInfo?: Map<string, {publishedAt?: string; distTags?: string[]; weeklyDownloads?: number}>
}): {
  documents: (GitCommitDocument | GitTagDocument)[]
  commitCount: number
  skippedCommitCount: number
  urlCount: number
  tagCount: number
} {
  const commits = input.commits
    .filter((commit) => input.github.queriedShas.has(commit.sha))
    .map((commit) => {
      const enrichment = input.github.info.get(commit.sha)
      if (!enrichment) return commit
      return {
        ...commit,
        ...(enrichment.testStudioUrl ? {testStudioUrl: enrichment.testStudioUrl} : {}),
        ...(enrichment.authorLogin ? {authorLogin: enrichment.authorLogin} : {}),
        ...(enrichment.authorAvatarUrl ? {authorAvatarUrl: enrichment.authorAvatarUrl} : {}),
      }
    })
  const tags = input.npmInfo
    ? input.tags.map((tag) => {
        const npm = input.npmInfo!.get(tag.tag)
        return npm ? {...tag, npm} : tag
      })
    : []
  return {
    documents: [...commits, ...tags],
    commitCount: commits.length,
    skippedCommitCount: input.commits.length - commits.length,
    urlCount: commits.filter((commit) => 'testStudioUrl' in commit).length,
    tagCount: tags.length,
  }
}
