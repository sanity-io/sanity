export function getComputedTranslateY(element) {
  if (!window.getComputedStyle) {
    return null
  }
  const style = getComputedStyle(element)
  const transform = style.transform || style.webkitTransform || style.mozTransform
  let mat = transform.match(/^matrix3d\((.+)\)$/)
  if (mat) {
    return parseFloat(mat[1].split(', ')[13])
  }
  mat = transform.match(/^matrix\((.+)\)$/)
  return mat ? parseFloat(mat[1].split(', ')[5]) : 0
}
