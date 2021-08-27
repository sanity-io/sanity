// this file was adapted from a previous dependency `type-of-is`
// https://github.com/stephenhandley/type-of-is/blob/7138a7e79f5af7c286bf8123f60843a91aaebf38/index.js
const _toString = {}.toString

const builtIns = [Object, Function, Array, String, Boolean, Number, Date, RegExp, Error]

function isBuiltIn(_constructor: unknown) {
  for (let i = 0; i < builtIns.length; i++) {
    if (builtIns[i] === _constructor) return true
  }
  return false
}

export default function typeString(obj: unknown): string {
  // [object Blah] -> Blah
  const stringType = _toString.call(obj).slice(8, -1)
  if (obj === null || obj === undefined) return stringType.toLowerCase()

  // eslint-disable-next-line @typescript-eslint/ban-types
  const constructorType = (obj as object).constructor
  if (constructorType && !isBuiltIn(constructorType)) return constructorType.name
  return stringType
}
