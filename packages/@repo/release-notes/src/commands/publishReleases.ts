/* oxlint-disable no-console */
import {DocumentId, getPublishedId, getVersionNameFromId, isVersionId} from '@sanity/id-utils'

import {client} from '../client'
import {octokit} from '../octokit'
import {type StudioChangelogEntry} from '../types'
import {stripPr} from '../utils/stripPrNumber'

export async function publishReleases(options: {dryRun: boolean; targetVersion: string}) {
  const changelogDocuments = await client.fetch<{_id: string; changelog: StudioChangelogEntry[]}[]>(
    '*[_type=="apiChange" && releaseAutomation.source == "studio" && releaseAutomation.tentativeVersion == $version]',
    {version: options.targetVersion},
    {perspective: 'raw'},
  )

  const documentIds = Array.from(
    new Set(changelogDocuments.map((doc) => getPublishedId(DocumentId(doc._id)))),
  )

  if (documentIds.length > 1) {
    throw new Error(
      `Multiple changelog documents found for studio version ${options.targetVersion}: ${documentIds.join(', ')}. Please make sure only one exists`,
    )
  }

  // -- publish content release
  const [changelogDocument] = changelogDocuments
  if (!changelogDocument) {
    throw new Error(
      `No changelog document found for version ${options.targetVersion}. Please make sure a changelog document exists with releaseAutomation.source=='studio' and releaseAutomation.tentativeVersion==${options.targetVersion}`,
    )
  }
  const changelogDocumentId = DocumentId(changelogDocument._id)
  console.log(`Found changelog for version ${options.targetVersion}`)

  if (isVersionId(changelogDocumentId)) {
    const releaseId = getVersionNameFromId(changelogDocumentId)
    if (options.dryRun) {
      console.log(`[DRY RUN] Unsetting releaseAutomation on document ${changelogDocumentId}`)
      console.log(
        `[DRY RUN] Publishing content release ${releaseId} for version ${options.targetVersion}`,
      )
    } else {
      // Unset releaseAutomation before publishing to avoid validation issues post-release
      console.log(`Unsetting releaseAutomation on document ${changelogDocumentId}`)
      await client.patch(changelogDocumentId).unset(['releaseAutomation']).commit()

      console.log(`Publishing content release ${releaseId} for version ${options.targetVersion}`)
      await client.releases.publish({releaseId})
      console.log(
        `🚀 Content release ${releaseId} for ${options.targetVersion} published successfully!`,
      )
    }
  } else {
    console.log(`Changelog for version ${options.targetVersion} already published.`)
  }

  // -- publish github release
  const formattedChangelog = `
Author | Message | Commit
------------ | ------------- | -------------
${changelogDocument.changelog
  .map((entry) => {
    return [
      mention(entry.author),
      `${stripPr(entry.header, entry.pr)} (#${entry.pr})`,
      entry.hash,
    ].join(' | ')
  })
  .join('\n')}
  `
  const createGithubReleasePayload = {
    owner: 'sanity-io',
    repo: 'sanity',
    // eslint-disable-next-line camelcase
    tag_name: `v${options.targetVersion}`,
    name: `v${options.targetVersion}`,
    body: ghReleaseTemplate({
      changelogDocumentId: getPublishedId(changelogDocumentId),
      targetVersion: options.targetVersion,
      changelog: formattedChangelog,
    }),
    draft: false,
  }
  if (options.dryRun) {
    console.log(
      `[DRY RUN] Create release for tag ${createGithubReleasePayload.tag_name} with name ${createGithubReleasePayload.name} on ${createGithubReleasePayload.owner}/${createGithubReleasePayload.repo} with body:`,
    )
    console.log()
    console.log(createGithubReleasePayload.body)
    console.log()
  } else {
    const response = await octokit.request(
      'POST /repos/{owner}/{repo}/releases',
      createGithubReleasePayload,
    )
    console.log('Created GitHub Release:', response.data.html_url)
  }
}

function mention(author: StudioChangelogEntry['author']) {
  if (author?.type !== 'bot') {
    return `@${author?.username}`
  }
  return author.username
}

function ghReleaseTemplate(vars: {
  changelogDocumentId: string
  targetVersion: string
  changelog: string
}) {
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

function conventionalPrefix(entry: StudioChangelogEntry) {
  if (!entry.type) {
    return ''
  }
  return `${entry.type}${entry.scope ? `(${entry.scope})` : ''}: `
}
