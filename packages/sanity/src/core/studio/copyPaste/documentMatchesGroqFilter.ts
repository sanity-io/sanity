import {type Path, type ReferenceOptions, type SanityDocument} from '@sanity/types'
import {evaluate, parse} from 'groq-js'

import {type Source} from '../../config'
import {resolveUserDefinedFilter} from '../../form/studio/inputs/reference/resolveUserDefinedFilter'
import {isEmptyValue} from './utils'

export async function documentMatchesGroqFilter(
  rootDocumentValue: unknown,
  referencedDocument: SanityDocument,
  schemaTypeOptions: ReferenceOptions,
  targetRootPath: Path,
  getClient: Source['getClient'],
): Promise<boolean> {
  // If no filter is provided, all documents match
  if (!schemaTypeOptions.filter) {
    return true
  }

  const options = await resolveUserDefinedFilter(
    schemaTypeOptions,
    rootDocumentValue as SanityDocument,
    targetRootPath,
    getClient,
  )

  if (!options.filter) {
    return true
  }

  try {
    const params = options.params || {}
    const query = `*[${options.filter}]`

    const tree = parse(query, params)
    const value = await evaluate(tree, {
      params,
      dataset: [referencedDocument],
    })

    const result = await value.get()

    return !isEmptyValue(result)
  } catch (error) {
    console.error('Error evaluating GROQ filter:', error)
    return false
  }
}
