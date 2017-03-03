/* Output (rougly):
 * (function(doc, urls) {
 *   urls.forEach(function (src) {
 *     var script = document.createElement('script')
 *     script.src = src
 *     script.async = false
 *     document.head.appendChild(script)
 *   })
 * })(document, ['a.js', 'b.js'])
 */

export default scripts => {
  const urls = `[${scripts.map(JSON.stringify).join(',')}]`
  return `!function(d,l){l.forEach(function(u){var n=d.createElement("script");n.src=u,n.async=!1,d.head.appendChild(n)})}(document,${urls});`
}
