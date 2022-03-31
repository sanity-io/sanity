import {SanityDocument} from '@sanity/client'
import {ExtractResult, transform} from '@sanity/tsdoc-to-portable-text'
import chalk from 'chalk'
import {_encodePackageName} from '../../_helpers'

export function transformTsdocToPortableText(options: {
  name: string
  scope?: string
  package?: SanityDocument
  quiet: boolean
  results: ExtractResult[]
  version: string
}): SanityDocument[] {
  const {scope, name, package: pkg, quiet, results, version} = options
  const fullName = _encodePackageName(scope, name)

  if (!quiet) {
    console.log(`${chalk.blue('info')} [${fullName}] Transform ...`)
  }

  const docs = transform(results, {package: {version}, currPackageDoc: pkg})

  console.log(`${chalk.green('success')} [${fullName}] Transformed ${docs.length} documents`)

  return docs as SanityDocument[]
}
