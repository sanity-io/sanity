/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = function groq(strings, ...keys) {
  const lastIndex = strings.length - 1
  return (
    strings.slice(0, lastIndex).reduce(function(acc, str, i) {
      return acc + str + keys[i]
    }, '') + strings[lastIndex]
  )
}
