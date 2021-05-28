import {Card, Code} from '@sanity/ui'
import React from 'react'
import {VisionError, VisionErrorDetails} from '../types'

export function QueryErrorDetails(props: {error: VisionError}) {
  const {error} = props
  const details = {...(error.details || {}), ...mapToLegacyDetails(error.details)}

  if (!details.line) {
    return null
  }

  return (
    <Card padding={4} radius={2} tone="critical">
      <Code>
        {[
          error.message,
          `${details.line}\n${dashLine(details.column || 0, details.columnEnd || 0)}\n`,
          `Line:   ${details.lineNumber}\nColumn: ${details.column}`,
        ].join('\n')}
      </Code>
    </Card>
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
