/* eslint-disable import/no-commonjs */
module.exports = function groq(strings, ...keys) {
  const lastIndex = strings.length - 1
  return (
    strings.slice(0, lastIndex).reduce((acc, str, i) => acc + str + keys[i], '') +
    strings[lastIndex]
  )
}
