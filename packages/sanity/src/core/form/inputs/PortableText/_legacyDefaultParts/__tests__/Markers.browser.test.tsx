import {FormBuilderContext} from 'sanity/_singletons'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type FormBuilderContextValue} from '../../../../FormBuilderContext'
import {DefaultCustomMarkers} from '../CustomMarkers'
import {DefaultMarkers} from '../Markers'

const FORM_BUILDER = {
  __internal: {
    components: {
      CustomMarkers: DefaultCustomMarkers,
      Markers: DefaultMarkers,
    },
  },
} as unknown as FormBuilderContextValue

function MarkersHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <FormBuilderContext.Provider value={FORM_BUILDER}>
        <DefaultMarkers
          markers={[]}
          validation={[
            {level: 'error', message: 'Alternative text is required', path: []},
            {level: 'warning', message: 'Keep the excerpt concise', path: []},
            {level: 'info', message: 'Formatting guidance', path: []},
          ]}
        />
      </FormBuilderContext.Provider>
    </TestWrapper>
  )
}

describe('Portable Text markers', () => {
  test('renders validation markers', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<MarkersHarness />)

    await expect.element(page.getByText('Alternative text is required')).toBeVisible()
    await settleChromaticEndState()
  })
})
