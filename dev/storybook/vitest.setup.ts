import {afterEach} from 'vitest'

import {assertStyleOrderIndependence} from '../../packages/sanity/test/browser/styleOrderGuard'

// The story is still mounted when this runs (the next story's render replaces
// it), so this checks the same state the story's snapshot shows. A story
// whose test already failed is left alone.
afterEach(async (context) => {
  if (context.task.result?.state !== 'fail') await assertStyleOrderIndependence()
})
