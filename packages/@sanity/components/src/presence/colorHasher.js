import stringHash from 'string-hash'

function toColor(str) {
  const rgb = [0, 0, 0]
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    const idx = char % 3
    rgb[idx] = (rgb[i % 3] + 13 * (char % 13)) % 20
  }

  const rgbStr = rgb.map((color, idx) => (idx === 3 ? color : (4 + color) * 17)).join(',')
  return `rgb(${rgbStr})`
}

// Sanity user IDs often start with the same character, reversing the string
// yields more unique values as the hashing function is cheap and dump
function reverse(str) {
  return str
    .split('')
    .reverse()
    .join('')
}

function hash(str) {
  return stringHash(reverse(str))
}

export default str => toColor(hash(str))
