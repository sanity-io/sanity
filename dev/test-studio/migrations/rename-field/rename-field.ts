import {patch, at, set} from '@sanity/migrate/mutations'
import {defineMigration} from '@sanity/migrate'

export default defineMigration({
  name: 'Change name of api.variable names from Foo to Bar',
  // type: 'api.variable',
  // filter: '_type == "api.variable" && name == "Foo"',
  async *run(documents) {
    for await (const document of documents) {
      if (document._type !== 'api.variable') continue

      yield patch(document._id, [at('name', set('Foo'))])
    }
  },
})
