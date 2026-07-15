import {defineQuery} from './define'
import {groq as groqTag} from './groq'

const groq: typeof groqTag & {defineQuery: typeof defineQuery} = Object.assign(groqTag, {
  defineQuery,
})

export {defineQuery}
export default groq

// `require('groq')` historically returned the tag function itself (the old CJS build assigned
// `module.exports = groq`). All supported node versions (`engines.node >=22.12`) can
// `require()` ESM, and return this export instead of the module namespace when it's named
// exactly 'module.exports': https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require
export {groq as 'module.exports'}
