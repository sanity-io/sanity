#!/usr/bin/env -S pnpm tsx
import {readEnv} from '@repo/utils'
import {type DraftId, type PublishedId, type VersionId} from '@sanity/id-utils'
import {type Commit, type CommitBase, type CommitMeta} from 'conventional-commits-parser'
import {type pMapSkip} from 'p-map'
import yargs from 'yargs'

import {bump} from '../src/commands/bump'
import {commentPrAfterMerge} from '../src/commands/commentPrAfterMerge'
import {createOrUpdateChangelogDocs} from '../src/commands/createOrUpdateChangelogDocs'
import {draftReleaseNotes} from '../src/commands/draftReleaseNotes'
import {publishReleases} from '../src/commands/publishReleases'
import {writeChangelogFiles} from '../src/commands/writeChangelogFiles'
import {writeCommitCheck} from '../src/commands/writeCommitCheck'
import {writePrChecks} from '../src/commands/writePrChecks'
import {type KnownEnvVar, type PullRequest} from '../src/types'
import {stripPr} from '../src/utils/stripPrNumber'

function getAdminStudioUrl(): string {
  return readEnv<KnownEnvVar>('RELEASE_NOTES_ADMIN_STUDIO_URL')
}

// oxlint-disable-next-line no-unused-expressions
await yargs(process.argv.slice(2))
  .strict()
  .usage('$0 <command>')
  .command({
    command: 'bump',
    describe: 'Bump version for all monorepo packages based on conventional commits',
    builder: (cmd) =>
      cmd.options({
        preid: {
          description: 'Prerelease identifier (e.g. next, canary, next-major)',
          type: 'string',
        },
        suffixType: {
          description: 'Prerelease suffix strategy: timestamp (default) or commit count',
          type: 'string',
          choices: ['timestamp', 'commits-ahead'] as const,
          default: 'timestamp' as const,
        },
        dryRun: {
          description: 'Print the new version without writing files',
          type: 'boolean',
        },
      }),
    handler: async (args) => {
      try {
        await bump({
          preid: args.preid,
          suffixType: args.suffixType,
          dryRun: args.dryRun,
        })
      } catch (error) {
        // oxlint-disable-next-line no-console
        console.error(error)
        process.exit(1)
      }
    },
  })
  .command({
    command: 'write-changelog-files',
    describe: 'Write CHANGELOG.md entries to root and all public packages',
    builder: (cmd) =>
      cmd.version(false).options({
        version: {
          description: 'The version to generate the changelog entry for, e.g. 5.19.0',
          type: 'string',
          demandOption: true,
        },
        dryRun: {
          description: 'Print changelog to stdout without writing files',
          type: 'boolean',
        },
      }),
    handler: async (args) => {
      try {
        await writeChangelogFiles({
          version: args.version,
          dryRun: args.dryRun,
        })
      } catch (error) {
        // oxlint-disable-next-line no-console
        console.error(error)
        process.exit(1)
      }
    },
  })
  .command({
    command: 'generate-changelog',
    describe: 'Generate release note documents for release PR',
    builder: (cmd) =>
      cmd.options({
        outputFormat: {
          type: 'string',
          demandOption: false,
          description:
            'Output format for changelog generation. Currently only `pr-description` supported.',
          enum: [
            // outputs PR summary description
            'pr-description',
          ],
        },
        baseVersion: {
          description: 'Base version for changelog generation. Should be the previous version.',
          type: 'string',
          demandOption: true,
        },
        tentativeVersion: {
          description: 'Tentative next version',
          type: 'string',
          demandOption: true,
        },
        dryRun: {
          description: 'Dry run',
          type: 'boolean',
        },
      }),
    handler: async (args) => {
      try {
        const result = await createOrUpdateChangelogDocs({
          baseVersion: args.baseVersion,
          tentativeVersion: args.tentativeVersion,
          dryRun: args.dryRun,
        })
        if (args.outputFormat === 'pr-description') {
          // oxlint-disable-next-line no-console
          console.log(
            generateChangeLogSummary(
              {tentativeVersion: args.tentativeVersion, baseVersion: args.baseVersion},
              result,
            ),
          )
        } else {
          // oxlint-disable-next-line no-console
          console.log(result)
        }
      } catch (error) {
        // oxlint-disable-next-line no-console
        console.error(error)
        process.exit(1)
      }
    },
  })
  .command({
    command: 'publish-releases',
    describe: 'Publish pending sanity.io Changelog & github release from the given target version',
    builder: (cmd) =>
      cmd.options({
        targetVersion: {
          description: 'Version',
          type: 'string',
          demandOption: true,
        },
        dryRun: {
          description: 'Dry run',
          type: 'boolean',
        },
      }),
    handler: async (args) => {
      try {
        await publishReleases({
          targetVersion: args.targetVersion,
          dryRun: Boolean(args.dryRun),
        })
        // oxlint-disable-next-line no-console
        console.info('ℹ️ This was a dry run. Nothing has been released.')
      } catch (error) {
        // oxlint-disable-next-line no-console
        console.error(error)
        process.exit(1)
      }
    },
  })
  .command({
    command: 'comment-pr-after-merge',
    describe: 'Create a comment on the PR(s) associated with a commit',
    builder: (cmd) =>
      cmd.options({
        commit: {
          description: 'Version',
          type: 'string',
          demandOption: true,
        },
        baseVersion: {
          description: 'Current base version. E.g. the current version in package.json',
          type: 'string',
          demandOption: true,
        },
      }),
    handler: async (args) => {
      try {
        await commentPrAfterMerge({
          baseVersion: args.baseVersion,
          commit: args.commit,
          adminStudioBaseUrl: getAdminStudioUrl(),
        })
      } catch (error) {
        // oxlint-disable-next-line no-console
        console.error(error)
        process.exit(1)
      }
    },
  })
  .command({
    command: 'status-check-prs',
    describe: 'Update in-flight release status checks for all open PRs',
    handler: () => writePrChecks().then(() => void 0),
  })
  .command({
    command: 'draft-release-notes',

    describe: 'Draft release notes',
    builder: (cmd) =>
      cmd.options({
        baseVersion: {
          description: 'Current base version. E.g. the current version in package.json',
          type: 'string',
          demandOption: true,
        },
      }),
    handler: (args) => draftReleaseNotes({baseVersion: args.baseVersion}).then(() => void 0),
  })
  .command({
    command: 'status-check-commit',
    describe: 'Update in-flight release status checks for a single commit',
    builder: (cmd) =>
      cmd.options({
        commit: {
          description: 'Head commit to run check on',
          type: 'string',
          demandOption: true,
        },
        pr: {
          description: 'Current pull request',
          type: 'number',
          demandOption: true,
        },
      }),
    handler: (args) =>
      writeCommitCheck({commit: args.commit, currentPrNumber: args.pr}).then(() => void 0),
  })
  .demandCommand(1, 'must provide a valid command')
  .help('h')
  .alias('h', 'help').argv

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
    Exclude<{conventionalCommit: CommitBase & CommitMeta; pr: any}, typeof pMapSkip>
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
  changelogDocumentId,
  releaseId,
}: {
  conventionalCommit: Commit
  pr: PullRequest
  changelogDocumentId: GenerateChangeLogResult['changelogDocumentId']
  releaseId: GenerateChangeLogResult['releaseId']
}) {
  const entryKey = conventionalCommit.hash!.slice(0, 8)
  const originalCommitMessage = stripPr(conventionalCommit.header || '', pr.number)
  const entryPath = encodeURIComponent(`changelog[_key=="${entryKey}"]`)
  const changelogEntryUrl = `${getAdminStudioUrl()}/intent/edit/id=${changelogDocumentId.published};path=${entryPath}/?perspective=${releaseId}`

  const byline = pr.user?.login ? `[${pr.user?.login}](${pr.user.html_url})` : ''
  const releaseNoteLink = `[:pencil:&nbsp;Edit](${changelogEntryUrl})`
  return `${byline} | ${originalCommitMessage} | [#${pr.number}](${pr.html_url}) | ${conventionalCommit.hash} | ${releaseNoteLink}`
}
