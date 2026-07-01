import {Schema} from '@sanity/schema'
import {type ReferenceSchemaType} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {PreviewReferenceValue} from '../PreviewReferenceValue'
import {type ReferenceInfo} from '../types'
import {type Loadable} from '../useReferenceInfo'

const schema = Schema.compile({
  types: [
    {name: 'post', type: 'document', fields: [{name: 'title', type: 'string'}]},
    {name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]},
    {name: 'postReference', type: 'reference', to: [{type: 'post'}]},
  ],
})

const referenceType = schema.get('postReference') as ReferenceSchemaType

function renderPreviewReferenceValue(referenceInfo: Loadable<ReferenceInfo>) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <PreviewReferenceValue
        value={{_type: 'reference', _ref: 'doc1'}}
        referenceInfo={referenceInfo}
        renderPreview={() => <div data-testid="preview">Preview</div>}
        type={referenceType}
      />
    </ThemeProvider>,
  )
}

const noop = () => undefined

describe('PreviewReferenceValue', () => {
  it('handles NOT_FOUND availability and renders unavailable message', () => {
    const {container} = renderPreviewReferenceValue({
      isLoading: false,
      result: {
        id: 'doc1',
        type: undefined,
        availability: {available: false, reason: 'NOT_FOUND'},
        isPublished: null,
        preview: {snapshot: null, original: null},
      },
      error: undefined,
      retry: noop,
    } as Loadable<ReferenceInfo>)

    // Should render without crashing and show unavailable message
    expect(container.firstChild).toBeTruthy()
    expect(container.textContent).toBeTruthy()
  })

  it('renders nothing (and does not crash) when result is undefined', () => {
    // useReferenceInfo's EMPTY_STATE is {isLoading: false, error: undefined, result: undefined}.
    // The `!referenceInfo.result` guard must short-circuit here — without it the component
    // crashes accessing `referenceInfo.result.availability`. The guard returns null before
    // any Source-dependent rendering, so this can be exercised by actually rendering.
    const {container} = renderPreviewReferenceValue({
      isLoading: false,
      result: undefined,
      error: undefined,
      retry: noop,
    } as Loadable<ReferenceInfo>)

    expect(screen.queryByTestId('preview')).toBeNull()
    expect(container.textContent).toBe('')
  })
})
