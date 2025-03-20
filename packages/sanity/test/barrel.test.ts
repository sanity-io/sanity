import {expect, test} from 'vitest'

import {defaultResolveFieldComponent} from '../src/core/form/studio/inputResolver/fieldResolver'

test('no barrel imports', () => {
  expect(defaultResolveFieldComponent).toBeDefined()
})
