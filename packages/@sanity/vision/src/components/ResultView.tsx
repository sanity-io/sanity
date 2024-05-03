import JSONInspector from '@rexxars/react-json-inspector'
import {Code} from '@sanity/ui'
import LRU from 'quick-lru'

import {ResultViewWrapper} from './ResultView.styled'

const lru = new LRU({maxSize: 50000})

export function ResultView(props: {data: unknown}) {
  const {data} = props

  if (isRecord(data) || Array.isArray(data)) {
    return (
      <ResultViewWrapper>
        <JSONInspector
          data={data}
          search={false}
          isExpanded={isExpanded}
          onClick={toggleExpanded}
        />
      </ResultViewWrapper>
    )
  }

  return <Code language="json">{JSON.stringify(data)}</Code>
}

function isExpanded(keyPath: string, value: unknown): boolean {
  const depthLimit = 4
  const cached = lru.get(keyPath) as boolean | undefined

  if (typeof cached === 'boolean') {
    return cached
  }

  const segments = keyPath.split('.', depthLimit)
  if (segments.length === depthLimit) {
    return false
  }

  if (Array.isArray(value)) {
    return true
  }

  return isRecord(value) && !segments.some((key) => isArrayKeyOverLimit(key))
}

function toggleExpanded(event: {path: string}): void {
  const {path} = event
  const current = lru.get(path)

  if (current === undefined) {
    // something is wrong
    return
  }

  lru.set(path, !current)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const numeric = /^\d+$/
function isArrayKeyOverLimit(segment: string, limit = 10) {
  return numeric.test(segment) && parseInt(segment, 10) > limit
}
