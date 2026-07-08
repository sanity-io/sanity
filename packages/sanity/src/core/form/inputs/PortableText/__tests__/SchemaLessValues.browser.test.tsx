import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {SchemaLessValuesStory} from './SchemaLessValuesStory'

describe('Portable Text Input', () => {
  describe('Values whose types left the schema', () => {
    // The story's document carries a `listItem`, a `style`, a decorator, and
    // an annotation that the (tightened) schema no longer declares. Each
    // block must render its text plainly instead of crashing the pane.
    it('renders every block despite schema-less values', async () => {
      const {getFocusedPortableTextInput} = testHelpers()
      void render(<SchemaLessValuesStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      await expect.element($portableTextInput.getByText('schema-less list item')).toBeVisible()
      await expect.element($portableTextInput.getByText('schema-less style')).toBeVisible()
      await expect.element($portableTextInput.getByText('schema-less decorator')).toBeVisible()
      await expect.element($portableTextInput.getByText('schema-less annotation')).toBeVisible()
    })
  })
})
