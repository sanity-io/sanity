import {getDefaultSchema} from '../src/parts/Schema' // mocked to test/mocks/schema.js
import {resolveInitialValue} from '../src'
import T from '../src/builder'

test('resolves deep, recursive default values', async () => {
  const defaultTemplates = T.defaults(getDefaultSchema()).map((tpl) => tpl.serialize())
  const developerTemplate = defaultTemplates.find((tpl) => tpl.id === 'developer')
  if (!developerTemplate) {
    throw new Error('Could not find developer template')
  }

  const initialValue = await resolveInitialValue(developerTemplate)

  // do assertions on:
  // eslint-disable-next-line no-console
  console.log(initialValue)
})
