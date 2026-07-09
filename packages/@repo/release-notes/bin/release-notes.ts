#!/usr/bin/env -S pnpm tsx
import {object, or} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {map, optional, withDefault} from '@optique/core/modifiers'
import {command, constant, option} from '@optique/core/primitives'
import {choice, integer, string} from '@optique/core/valueparser'
import {run} from '@optique/run'
import {readEnv} from '@repo/utils'
import {type DraftId, type PublishedId, type VersionId} from '@sanity/id-utils'
import {type Commit, type CommitBase, type CommitMeta} from 'conventional-commits-parser'
import {type pMapSkip} from 'p-map'

import {bump} from '../src/commands/bump'
import {commentPrAfterMerge} from '../src/commands/commentPrAfterMerge'
import {createOrUpdateChangelogDocs} from '../src/commands/createOrUpdateChangelogDocs'
import {draftReleaseNotes} from '../src/commands/draftReleaseNotes'
import {publishReleases} from '../src/commands/publishReleases'
import {writeChangelogFiles} from '../src/commands/writeChangelogFiles'
import {writeCommitCheck} from '../src/commands/writeCommitCheck'
import {writePrChecks} from '../src/commands/writePrChecks'
import {type CommitAuthor, type KnownEnvVar, type PullRequest} from '../src/types'
import {isBreakingChange} from '../src/utils/isBreakingChange'
import {stripPr} from '../src/utils/stripPrNumber'

function getAdminStudioUrl(): string {
  return readEnv<KnownEnvVar>('RELEASE_NOTES_ADMIN_STUDIO_URL')
}

const dryRun = option('--dryRun', {
  description: message`Dry run`,
})

const parser = or(
  command(
    'bump',
    object({
      action: constant('bump'),
      preid: optional(
        option('--preid', string(), {
          description: message`Prerelease identifier (e.g. next, canary, next-major)`,
        }),
      ),
      suffixType: withDefault(
        option('--suffixType', choice(['timestamp', 'commits-ahead']), {
          description: message`Prerelease suffix strategy: timestamp (default) or commit count`,
        }),
        'timestamp' as const,
      ),
      buildMetadata: map(
        option('--no-buildMetadata', {
          description: message`Skip appending +<commitHash> build metadata to the version`,
        }),
        (noBuildMetadata) => !noBuildMetadata,
      ),
      dryRun: option('--dryRun', {
        description: message`Print the new version without writing files`,
      }),
    }),
    {description: message`Bump version for all monorepo packages based on conventional commits`},
  ),
  command(
    'write-changelog-files',
    object({
      action: constant('write-changelog-files'),
      version: option('--version', string(), {
        description: message`The version to generate the changelog entry for, e.g. 5.19.0`,
      }),
      dryRun: option('--dryRun', {
        description: message`Print changelog to stdout without writing files`,
      }),
    }),
    {description: message`Write CHANGELOG.md entries to root and all public packages`},
  ),
  command(
    'generate-changelog',
    object({
      action: constant('generate-changelog'),
      outputFormat: optional(
        option('--outputFormat', choice(['pr-description']), {
          description: message`Output format for changelog generation. Currently only pr-description supported.`,
        }),
      ),
      baseVersion: option('--baseVersion', string(), {
        description: message`Base version for changelog generation. Should be the previous version.`,
      }),
      tentativeVersion: option('--tentativeVersion', string(), {
        description: message`Tentative next version`,
      }),
      dryRun,
    }),
    {description: message`Generate release note documents for release PR`},
  ),
  command(
    'publish-releases',
    object({
      action: constant('publish-releases'),
      targetVersion: option('--targetVersion', string(), {
        description: message`Version`,
      }),
      dryRun,
    }),
    {
      description: message`Publish pending sanity.io Changelog & github release from the given target version`,
    },
  ),
  command(
    'comment-pr-after-merge',
    object({
      action: constant('comment-pr-after-merge'),
      commit: option('--commit', string(), {
        description: message`Version`,
      }),
      baseVersion: option('--baseVersion', string(), {
        description: message`Current base version. E.g. the current version in package.json`,
      }),
    }),
    {description: message`Create a comment on the PR(s) associated with a commit`},
  ),
  command('status-check-prs', object({action: constant('status-check-prs')}), {
    description: message`Update in-flight release status checks for all open PRs`,
  }),
  command(
    'draft-release-notes',
    object({
      action: constant('draft-release-notes'),
      baseVersion: option('--baseVersion', string(), {
        description: message`Current base version. E.g. the current version in package.json`,
      }),
    }),
    {description: message`Draft release notes`},
  ),
  command(
    'status-check-commit',
    object({
      action: constant('status-check-commit'),
      commit: option('--commit', string(), {
        description: message`Head commit to run check on`,
      }),
      pr: option('--pr', integer(), {
        description: message`Current pull request`,
      }),
    }),
    {description: message`Update in-flight release status checks for a single commit`},
  ),
)

const args = run(parser, {programName: 'release-notes', help: 'both', aboveError: 'usage'})

switch (args.action) {
  case 'bump':
    await bump({
      preid: args.preid,
      suffixType: args.suffixType,
      buildMetadata: args.buildMetadata,
      dryRun: args.dryRun,
    })
    break
  case 'write-changelog-files':
    await writeChangelogFiles({
      version: args.version,
      dryRun: args.dryRun,
    })
    break
  case 'generate-changelog': {
    const result = await createOrUpdateChangelogDocs({
      baseVersion: args.baseVersion,
      tentativeVersion: args.tentativeVersion,
      dryRun: args.dryRun,
    })
    if (args.outputFormat === 'pr-description') {
      console.log(
        generateChangeLogSummary(
          {tentativeVersion: args.tentativeVersion, baseVersion: args.baseVersion},
          result,
        ),
      )
    } else {
      console.log(result)
    }
    break
  }
  case 'publish-releases':
    await publishReleases({
      targetVersion: args.targetVersion,
      dryRun: args.dryRun,
    })
    console.info('ℹ️ This was a dry run. Nothing has been released.')
    break
  case 'comment-pr-after-merge':
    await commentPrAfterMerge({
      baseVersion: args.baseVersion,
      commit: args.commit,
      adminStudioBaseUrl: getAdminStudioUrl(),
    })
    break
  case 'status-check-prs':
    await writePrChecks()
    break
  case 'draft-release-notes':
    await draftReleaseNotes({baseVersion: args.baseVersion})
    break
  case 'status-check-commit':
    await writeCommitCheck({commit: args.commit, currentPrNumber: args.pr})
    break
}

type GenerateChangeLogResult = {
  success?: boolean
  changelogDocumentId: {
    published: PublishedId
    version: VersionId
    draft: DraftId
  }
  apiVersionDocId: {
    published: PublishedId
    version: VersionId
    draft: DraftId
  }
  commitsWithPrs: Array<
    Exclude<
      {conventionalCommit: CommitBase & CommitMeta; pr?: any; commitAuthor?: any},
      typeof pMapSkip
    >
  >
  releaseId: string
}

function generateChangeLogSummary(
  {tentativeVersion, baseVersion}: {tentativeVersion: string; baseVersion: string},
  result: GenerateChangeLogResult,
) {
  const {changelogDocumentId, commitsWithPrs, releaseId} = result

  const commitCount = commitsWithPrs.length

  const entriesSection =
    commitCount === 0
      ? ''
      : commitsWithPrs
          .map((entry) =>
            formatEntry({
              pr: entry.pr,
              commitAuthor: entry.commitAuthor,
              conventionalCommit: entry.conventionalCommit,
              changelogDocumentId,
              releaseId,
            }),
          )
          .join('\n')

  const changelogUrl = `${getAdminStudioUrl()}/intent/edit/id=${changelogDocumentId.published}/?perspective=${releaseId}`
  const contentReleaseUrl = `${getAdminStudioUrl()}/intent/release/id=${releaseId}/?perspective=${releaseId}`

  return `
🤖 I have created a release \`**squib**\` \`**squob**\`

📜 A [content release](${contentReleaseUrl}) has been created with a [changelog document](${changelogUrl}) that includes release notes from all PRs included in this release.

Note: Entries in the changelog document can be safely edited and will never be overwritten by automation.

### 🚀 Steps to release
1. Mark this PR as ready for review to block open PRs from being merged while release is in progress
2. Ensure the [content release](${contentReleaseUrl}) is ready to go and passes validation
3. Merge this PR

Once this PR is merged, automation will take care of the rest by:
- Publishing **\`v${tentativeVersion}\`** of all public packages in this repo to the npm registry and tagging as \`latest\`
- Publishing the [content release](${contentReleaseUrl}) for **\`v${tentativeVersion}\`**
- Tagging, creating, and publishing a GitHub Release for **\`v${tentativeVersion}\`**
- Building and uploading bundles for Auto Updating Studios

### Pending changes
Author | Message | PR | Commit | Note
------------ | ------------- | ------------- | ------------- | -------------
${entriesSection}
`
}

function formatEntry({
  conventionalCommit,
  pr,
  commitAuthor,
  changelogDocumentId,
  releaseId,
}: {
  conventionalCommit: Commit
  pr: PullRequest | undefined
  commitAuthor: CommitAuthor | undefined
  changelogDocumentId: GenerateChangeLogResult['changelogDocumentId']
  releaseId: GenerateChangeLogResult['releaseId']
}) {
  const entryKey = conventionalCommit.hash!.slice(0, 8)
  const breakingMarker = isBreakingChange(conventionalCommit) ? '⚠️ ' : ''
  const originalCommitMessage =
    breakingMarker + stripPr(conventionalCommit.header || '', pr?.number)
  const entryPath = encodeURIComponent(`changelog[_key=="${entryKey}"]`)
  const changelogEntryUrl = `${getAdminStudioUrl()}/intent/edit/id=${changelogDocumentId.published};path=${entryPath}/?perspective=${releaseId}`

  if (!pr) {
    console.warn(
      `⚠️  WARNING: GitHub returned no PR association for commit ${conventionalCommit.hash}. ` +
        `Rendering changelog row without author info.`,
    )
  }

  const author = commitAuthor ?? pr?.user
  const byline = author?.login ? `[${author.login}](${author.html_url})` : '—'
  const prCell = pr ? `[#${pr.number}](${pr.html_url})` : '—'
  const releaseNoteLink = `[:pencil:&nbsp;Edit](${changelogEntryUrl})`
  return `${byline} | ${originalCommitMessage} | ${prCell} | ${conventionalCommit.hash} | ${releaseNoteLink}`
}
