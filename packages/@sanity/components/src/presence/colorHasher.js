import stringHash from 'string-hash'
import palx from 'palx'
import styles from './colorHasher.css'

const brandPrimary = styles.brandPrimary || '#fcc'

const pal = palx(brandPrimary)

// Picks strong colors from a palette created from the brand primary color
function toColor(str) {
  if (!str) {
    return brandPrimary
  }
  const hashFloat = stringHash(str) / Math.pow(2, 32)
  // ignore base and black from palx
  const hue = Object.keys(pal).slice(2)[Math.floor(hashFloat * (Object.keys(pal).length - 2))]
  // Skip the first 6 colors because they are light
  const strongColors = pal[hue].slice(6)
  const colorStep = Math.floor(hashFloat * strongColors.length) + 6
  return pal[hue][colorStep]
}

// Sanity user IDs often start with the same character, reversing the string
// yields more unique values as the hashing function is cheap and dump
function reverse(str) {
  return str
    .split('')
    .reverse()
    .join('')
}

export default str => toColor(str && reverse(str))
