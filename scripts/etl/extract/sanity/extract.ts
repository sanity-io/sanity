import {createClient as createSanityClient, SanityDocument} from '@sanity/client'
import chalk from 'chalk'
import {_encodePackageName} from '../../_helpers'
import {config} from '../../config'

export async function extractPackagesFromSanity(options: {
  quiet: boolean
  workspace: string[]
}): Promise<SanityDocument[]> {
  const {quiet, workspace} = options

  if (!quiet) {
    console.log(`${chalk.blue('info')} Extract packages from Sanity ...`)
  }

  let data: SanityDocument[] = []

  if (config.sanity.token) {
    const sanityClient = createSanityClient({
      ...config.sanity,
      apiVersion: '2021-06-01',
      useCdn: false,
    })

    data = await sanityClient.fetch(`*[_type == 'api.package']`)
  }

  return data
    .filter((d) => {
      const nameStr = [d.scope, d.name].filter(Boolean).join('/')

      return workspace.includes(nameStr)
    })
    .map((d) => _extractPackage({data: d, scope: d.scope, name: d.name}))
}

function _extractPackage(options: {
  data: SanityDocument
  scope?: string
  name: string
}): SanityDocument {
  const {data, scope, name} = options
  const fullName = _encodePackageName(scope, name)

  const result = {...data} as Record<string, unknown>

  delete result._createdAt
  delete result._updatedAt

  console.log(`${chalk.green('success')} [${fullName}] Extracted package from Sanity`)

  return result as SanityDocument
}
