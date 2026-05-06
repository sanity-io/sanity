import {EMPTY} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {createMockDocumentOperationArgs} from '../__tests__/operationTestUtils'
import {commit} from './commit'

describe('commit', () => {
  it('is never disabled', () => {
    expect(commit.disabled(createMockDocumentOperationArgs())).toBe(false)
  })

  it('commits the document and returns an empty observable', () => {
    const args = createMockDocumentOperationArgs()

    expect(commit.execute(args)).toBe(EMPTY)
    expect(args.document.commit).toHaveBeenCalledTimes(1)
  })
})
