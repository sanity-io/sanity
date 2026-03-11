// This import uses .js extension to reference a .ts file (ESM-style TypeScript import)
// This is the pattern that breaks in sanity 5.8+ (GitHub issue #12125)
import {schema} from './schema.js'

export default {
  name: 'test',
  schema,
}
