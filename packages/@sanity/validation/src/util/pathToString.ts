import {Path, isKeyedObject} from '@sanity/types'

export default function pathToString(path: Path | undefined = []): string {
  return path.reduce<string>((target, segment, i) => {
    const segmentType = typeof segment
    if (segmentType === 'number') {
      return `${target}[${segment}]`
    }

    if (segmentType === 'string') {
      const separator = i === 0 ? '' : '.'
      return `${target}${separator}${segment}`
    }

    if (isKeyedObject(segment)) {
      return `${target}[_key=="${segment._key}"]`
    }

    throw new Error(`Unsupported path segment "${segment}"`)
  }, '')
}
