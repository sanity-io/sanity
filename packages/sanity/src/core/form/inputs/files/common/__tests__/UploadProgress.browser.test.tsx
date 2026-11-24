import {type UploadState} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {UploadProgress} from '../UploadProgress'

const LONG_FILENAME = 'a-very-long-file-name-that-should-be-truncated-in-the-upload-progress.png'

const UPLOAD_STATE: UploadState = {
  progress: 40,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  file: {name: LONG_FILENAME, type: 'image/png'},
}

function UploadProgressHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <div style={{width: 500}}>
        <UploadProgress uploadState={UPLOAD_STATE} onCancel={noop} onStale={noop} />
      </div>
    </TestWrapper>
  )
}

describe('upload progress', () => {
  test('truncates a long file name instead of overflowing the card', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<UploadProgressHarness />)

    const filename = page.getByText(LONG_FILENAME)
    await expect.element(filename).toBeVisible()

    const code = filename.element() as HTMLElement
    const codeRect = code.getBoundingClientRect()
    const cardRect = code.closest('[data-ui="Card"]')!.getBoundingClientRect()
    const buttonRect = page.getByRole('button', {name: 'Cancel'}).element().getBoundingClientRect()

    expect(codeRect.width).toBeLessThanOrEqual(200)
    expect(code.scrollWidth).toBeGreaterThan(code.clientWidth)
    expect(getComputedStyle(code).textOverflow).toBe('ellipsis')
    expect(codeRect.left).toBeGreaterThanOrEqual(cardRect.left)
    expect(codeRect.right).toBeLessThanOrEqual(buttonRect.left)
    await settleChromaticEndState()
  })
})
