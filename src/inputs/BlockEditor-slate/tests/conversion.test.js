import canonical from './canonical'
import slate from './slate'
import toSlate from '../conversion/toSlate'
import fromSlate from '../conversion/fromSlate'
import assert from 'assert'
import {inspect} from 'util'

console.log(inspect(toSlate(canonical).document, {depth: Infinity}))
// console.log()
// console.log()
// console.log(inspect(slate.document, {depth: Infinity}))

