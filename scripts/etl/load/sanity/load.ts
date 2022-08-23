import createSanityClient, {SanityDocument} from '@sanity/client'
import {TransformResult} from '@sanity/tsdoc-to-portable-text'
import chalk from 'chalk'
import {config} from '../../config'

export async function loadToSanity(docs: TransformResult): Promise<void> {
  if (!config.sanity.token) {
    // prettier-ignore
    console.log(
      `${chalk.gray('ignore')} No token provided - skipped writing docs to Sanity (${config.sanity.projectId}:${config.sanity.dataset})`
    )

    return
  }

  const sanityClient = createSanityClient({
    ...config.sanity,
    apiVersion: '2021-06-01',
    useCdn: false,
  })

  let tx = sanityClient.transaction()

  for (const doc of docs) {
    tx = tx.createOrReplace(doc as unknown as SanityDocument)
  }

  await tx.commit()

  // prettier-ignore
  console.log(
    `${chalk.green('success')} Loaded ${docs.length} documents to Sanity (${config.sanity.projectId}:${config.sanity.dataset})`
  )
}
