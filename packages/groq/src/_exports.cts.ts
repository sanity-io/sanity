import {defineQuery} from './define'
import {groq} from './groq'

module.exports = groq

Object.assign(module.exports, {defineQuery})

/**
 * This is just to fix the typegen for the CJS export, as TS won't pick up on `module.exports` syntax when the package.json has `type: "module"`
 */
export type {groq as default, defineQuery}
