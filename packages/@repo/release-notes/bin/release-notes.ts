#!/usr/bin/env -S pnpm tsx
import {type DraftId, type PublishedId, type VersionId} from '@sanity/id-utils'
import {type Commit, type CommitBase, type CommitMeta} from 'conventional-commits-parser'
import {type pMapSkip} from 'p-map'
import yargs from 'yargs'

import {createOrUpdateChangelogDocs} from '../src/commands/createOrUpdateChangelogDocs'
import {generatePRSummary} from '../src/commands/generatePRSummary'
import {type PullRequest} from '../src/types'
import {stripPr} from '../src/utils/stripPrNumber'

const ADMIN_STUDIO_URL = `http://localhost:3333/`

// oxlint-disable-next-line no-unused-expressions
Promise.resolve(
  yargs(process.argv.slice(2))
    .strict()
    .usage('$0 <command>')
    .command({
      command: 'generate-pr-summary',
      describe: 'Generate release notes for release PR',
      builder: (cmd) =>
        cmd.options({
          displayVersion: {type: 'string', demandOption: false},
          pr: {type: 'number', demandOption: false},
        }),
      handler: (args) => {
        generatePRSummary({version: args.displayVersion}).catch(console.error)
      },
    })
    .command({
      command: 'generate-changelog',
      describe: 'Generate release note documents for release PR',
      builder: (cmd) =>
        cmd.options({
          pr: {type: 'number', demandOption: true},
          outputFormat: {
            type: 'string',
            demandOption: false,
            enum: [
              // outputs PR summary description
              'pr-description',
            ],
          },
          tentativeVersion: {type: 'string', demandOption: true},
        }),
      handler: (args) => {
        return createOrUpdateChangelogDocs({
          pr: args.pr,
          tentativeVersion: args.tentativeVersion,
        })
          .then((result) => {
            if (args.outputFormat === 'pr-description') {
              // oxlint-disable-next-line no-console
              console.log(generateChangeLogSummary(args.tentativeVersion, result))
            } else {
              // oxlint-disable-next-line no-console
              console.log(result)
            }
            return undefined
          })
          .catch((error) => {
            // oxlint-disable-next-line no-console
            console.error(error.stack)
            process.exit(1)
          })
      },
    })
    .demandCommand(1, 'must provide a valid command')
    .help('h')
    .alias('h', 'help').argv,
).catch(console.error)

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

### Staged changes

Author | Message | PR | Commit | &nbsp;Note&nbsp;
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
