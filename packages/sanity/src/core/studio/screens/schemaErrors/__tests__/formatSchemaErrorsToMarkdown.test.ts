import {type SchemaValidationProblemGroup} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {type SchemaErrorContext} from '../../../../config/SchemaError'
import {formatSchemaErrorsToMarkdown} from '../formatSchemaErrorsToMarkdown'

const PROBLEM_GROUPS: SchemaValidationProblemGroup[] = [
  {
    path: [{kind: 'type', type: 'document', name: 'article'}],
    problems: [{severity: 'error', message: 'Unknown type "mediaGalleryItem"'}],
  },
]

const CONTEXT: SchemaErrorContext = {
  workspaceName: 'staging',
  projectId: 'abc123',
  dataset: 'staging-dataset',
}

describe('formatSchemaErrorsToMarkdown', () => {
  test('omits the location block when no context is given', () => {
    const markdown = formatSchemaErrorsToMarkdown(PROBLEM_GROUPS)

    expect(markdown).not.toContain('Workspace:')
    expect(markdown).not.toContain('Dataset:')
  })

  test('lists the workspace, project and dataset under the top-level heading', () => {
    const markdown = formatSchemaErrorsToMarkdown(PROBLEM_GROUPS, CONTEXT)

    expect(markdown).toContain('- Workspace: staging\n')
    expect(markdown).toContain('- Project ID: abc123\n')
    expect(markdown).toContain('- Dataset: staging-dataset\n')
    expect(markdown.indexOf('# Schema errors')).toBeLessThan(markdown.indexOf('- Workspace:'))
    expect(markdown.indexOf('- Dataset:')).toBeLessThan(markdown.indexOf('## Document type'))
  })

  test('omits the source when the workspace root source failed', () => {
    expect(formatSchemaErrorsToMarkdown(PROBLEM_GROUPS, CONTEXT)).not.toContain('- Source:')
  })

  test('names the source when a nested source failed', () => {
    const markdown = formatSchemaErrorsToMarkdown(PROBLEM_GROUPS, {
      ...CONTEXT,
      sourceName: 'nested',
    })

    expect(markdown).toContain('- Source: nested\n')
  })

  test('adds no heading of its own', () => {
    const withContext = formatSchemaErrorsToMarkdown(PROBLEM_GROUPS, CONTEXT)
    const withoutContext = formatSchemaErrorsToMarkdown(PROBLEM_GROUPS)

    expect(withContext.match(/^#+ /gm)).toEqual(withoutContext.match(/^#+ /gm))
  })
})
