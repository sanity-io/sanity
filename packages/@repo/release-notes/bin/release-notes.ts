#!/usr/bin/env -S pnpm tsx
import {readEnv} from '@repo/utils'
import {type DraftId, type PublishedId, type VersionId} from '@sanity/id-utils'
import {type Commit, type CommitBase, type CommitMeta} from 'conventional-commits-parser'
import {type pMapSkip} from 'p-map'
import yargs from 'yargs'

import {createOrUpdateChangelogDocs} from '../src/commands/createOrUpdateChangelogDocs'
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
  const releaseNoteLink = `[:pencil: Edit](${changelogEntryUrl})`
  return `${byline} | ${originalCommitMessage} | [#${pr.number}](${pr.html_url}) | ${conventionalCommit.hash} | ${releaseNoteLink}`
}
