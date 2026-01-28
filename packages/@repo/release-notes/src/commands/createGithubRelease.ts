import {DocumentId, getPublishedId} from '@sanity/id-utils'
import {type CoAuthor} from 'description-to-co-authors'

import {client} from '../client'
import {STUDIO_PLATFORM_DOCUMENT_ID} from '../constants'

type ChangelogEntry = {
  _key: string
  _type: string
  author: {
    imageUrl: string
    type: string
    url: string
    username: string
  }
  coAuthors: CoAuthor[]
  authorAssociation: string
  exclude: boolean
  hash: string
  pr: number
  scope: number
  subject: string
  header: string
  type: string
}

export async function createGithubRelease(options: {targetVersion: string}) {
  const changelogDocuments = await client.fetch<{_id: string; changelog: ChangelogEntry[]}[]>(
    '*[_type=="apiChange" && version->semver == $version && version->platform._ref == $studioPlatformId]',
    {version: options.targetVersion, studioPlatformId: STUDIO_PLATFORM_DOCUMENT_ID},
  )
  if (changelogDocuments.length === 0) {
    throw new Error(
      `No changelog document found for version "${options.targetVersion}". Has the content release been published?`,
    )
  }
  const documentIds = Array.from(
    new Set(changelogDocuments.map((doc) => getPublishedId(DocumentId(doc._id)))),
  )

  if (documentIds.length > 1) {
    throw new Error(
      `Multiple changelog documents found for studio version ${options.targetVersion}: ${documentIds.join(', ')}. Please make sure only one exists`,
    )
  }

  const [changelogDocument] = changelogDocuments
  const formattedChangelog = `
Author | Message | Commit
------------ | ------------- | -------------
${changelogDocument.changelog.map((entry) => `${atAuthor(entry.author)} | ${entry.header} | ${entry.hash}`).join('\n')}
  `
  return template({
    changelogDocumentId: documentIds[0],
    targetVersion: options.targetVersion,
    changelog: formattedChangelog,
  })
}

function atAuthor(author: ChangelogEntry['author']) {
  if (author.type !== 'bot') {
    return `@${author.username}`
  }
  return author.username
}
function template(vars: {changelogDocumentId: string; targetVersion: string; changelog: string}) {
  return `# Sanity Studio v${vars.targetVersion}

This release includes various improvements and bug fixes.

For the complete changelog with all details, please visit:
[www.sanity.io/changelog/${vars.changelogDocumentId}](https://www.sanity.io/changelog/${vars.changelogDocumentId})

## Install or upgrade Sanity Studio

To upgrade to this version, run:

\`\`\`bash
npm install sanity@latest
\`\`\`

To initiate a new Sanity Studio project or learn more about upgrading, please refer to our comprehensive guide on [Installing and Upgrading Sanity Studio](https://www.sanity.io/docs/upgrade).

# 📓 Full changelog
${vars.changelog}
`
}
