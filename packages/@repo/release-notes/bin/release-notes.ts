#!/usr/bin/env -S pnpm tsx
import {readEnv} from '@repo/utils'
import {type DraftId, type PublishedId, type VersionId} from '@sanity/id-utils'
import {type Commit, type CommitBase, type CommitMeta} from 'conventional-commits-parser'
import {type pMapSkip} from 'p-map'
import yargs from 'yargs'

import {commentPrAfterMerge} from '../src/commands/commentPrAfterMerge'
import {createOrUpdateChangelogDocs} from '../src/commands/createOrUpdateChangelogDocs'
import {draftReleaseNotes} from '../src/commands/draftReleaseNotes'
import {publishReleases} from '../src/commands/publishReleases'
import {writeCommitCheck} from '../src/commands/writeCommitCheck'
import {writePrChecks} from '../src/commands/writePrChecks'
import {type KnownEnvVar, type PullRequest} from '../src/types'
import {stripPr} from '../src/utils/stripPrNumber'

const ADMIN_STUDIO_URL = readEnv<KnownEnvVar>('RELEASE_NOTES_ADMIN_STUDIO_URL')

// oxlint-disable-next-line no-unused-expressions
await yargs(process.argv.slice(2))
  .strict()
  .usage('$0 <command>')
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
      }),
    handler: async (args) => {
      try {
        const result = await createOrUpdateChangelogDocs({
          baseVersion: args.baseVersion,
          tentativeVersion: args.tentativeVersion,
        })
        if (args.outputFormat === 'pr-description') {
          // oxlint-disable-next-line no-console
          console.log(generateChangeLogSummary(args.tentativeVersion, result))
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
      }),
    handler: async (args) => {
      try {
        await publishReleases({
          targetVersion: args.targetVersion,
        })
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
          description:
            'Current base version. E.g. the current version in package.json / lerna.json',
          type: 'string',
          demandOption: true,
        },
      }),
    handler: async (args) => {
      try {
        await commentPrAfterMerge({
          baseVersion: args.baseVersion,
          commit: args.commit,
          adminStudioBaseUrl: ADMIN_STUDIO_URL,
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
          description:
            'Current base version. E.g. the current version in package.json / lerna.json',
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

function generateChangeLogSummary(tentativeVersion: string, result: GenerateChangeLogResult) {
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

  return `
🤖 I have created a release **squib** **squob**

Merging this PR will publish **\`v${tentativeVersion}\`** to npm 🚀

:scroll: **[Draft changelog](${ADMIN_STUDIO_URL}/intent/edit/id=${changelogDocumentId.published}/?perspective=${releaseId})**

### Changes to be released

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
  const originalCommitMessage = stripPr(conventionalCommit.subject || '', pr.number)
  const entryPath = encodeURIComponent(`changelog[_key=="${entryKey}"]`)
  const changelogEntryUrl = `${ADMIN_STUDIO_URL}/intent/edit/id=${changelogDocumentId.published};path=${entryPath}/?perspective=${releaseId}`

  const byline = pr.user?.login ? `[${pr.user?.login}](${pr.user.html_url})` : ''
  const releaseNoteLink = `[:pencil:&nbsp;Edit](${changelogEntryUrl})`
  return `${byline} | ${originalCommitMessage} | [#${pr.number}](${pr.html_url}) | ${conventionalCommit.hash} | ${releaseNoteLink}`
}
