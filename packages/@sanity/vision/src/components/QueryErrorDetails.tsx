import React from 'react'
import {VisionError, VisionErrorDetails} from '../types'

function QueryErrorDetails(props: {error: VisionError}) {
  const details = {...(props.error.details || {}), ...mapToLegacyDetails(props.error.details)}
  if (!details.line) {
    return null
  }

  return (
    <div>
      <pre>
        <code>{`${details.line}\n${dashLine(details.column || 0, details.columnEnd || 0)}`}</code>
      </pre>
      <pre>
        <code>{`Line:   ${details.lineNumber}\nColumn: ${details.column}`}</code>
      </pre>
    </div>
  )
}

function mapToLegacyDetails(details?: VisionErrorDetails) {
  if (!details || typeof details.query !== 'string' || typeof details.start !== 'number') {
    return {}
  }

  const {query, start, end} = details
  const lineStart = query.slice(0, start).lastIndexOf('\n') + 1
  const lineNumber = (query.slice(0, lineStart).match(/\n/g) || []).length
  const line = query.slice(lineStart, query.indexOf('\n', lineStart))
  const column = start - lineStart
  const columnEnd = typeof end === 'number' ? end - lineStart : undefined

  return {line, lineNumber, column, columnEnd}
}

function dashLine(column: number, columnEnd: number) {
  const line = '-'.repeat(column)
  const hats = `^`.repeat(columnEnd ? columnEnd - column : 1)
  return `${line}${hats}`
}

export default QueryErrorDetails
