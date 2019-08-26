import stringHash from 'string-hash'
import palx from 'palx'
import chroma from 'chroma-js'
import {memoize} from 'lodash'
import styles from './colorHasher.css'

const readVar = varName =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()

const getBrandPrimary = memoize(() => {
  if (chroma.valid(styles.brandPrimary)) {
    return styles.brandPrimary
  }
  const fromVar = readVar('--brand-primary')
  return fromVar && chroma.valid(fromVar) ? fromVar : '#fcc'
})

const getPalette = memoize(palx)

// Picks strong colors from a palette created from the brand primary color
function toColor(str) {
  const brandPrimary = getBrandPrimary()
  if (!str) {
    return brandPrimary
  }

  const pal = getPalette(brandPrimary)
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
