import {
  APIPackageDocument,
  ExtractResult,
  transform,
  TransformResult,
} from '@sanity/tsdoc-to-portable-text'
import chalk from 'chalk'
import {_encodePackageName} from '../../_helpers'

export function transformTsdocToPortableText(options: {
  name: string
  scope?: string
  package?: APIPackageDocument
  quiet: boolean
  results: ExtractResult[]
  version: string
}): TransformResult {
  const {scope, name, package: currPackageDoc, quiet, results, version} = options
  const fullName = _encodePackageName(scope, name)

  if (!quiet) {
    console.log(`${chalk.blue('info')} [${fullName}] Transform ...`)
  }

  const docs = transform(results, {package: {version}, currPackageDoc})

  console.log(`${chalk.green('success')} [${fullName}] Transformed ${docs.length} documents`)

  return docs
}
