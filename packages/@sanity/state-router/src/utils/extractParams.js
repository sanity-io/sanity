import flatten from 'lodash/flatten'

export default function extractParams(pattern) {
  return flatten(
    pattern.split('/')
      .filter(Boolean)
      .filter(segment => segment.startsWith(':'))
      .map(segment => segment.substring(1))
  )
}
