import React from 'react'
import {Box} from '@sanity/ui'
import {ErrorCode} from './QueryErrorDialog.styled'

function QueryErrorDetails(props) {
  const details = {...props.error.details, ...mapToLegacyDetails(props.error.details)}
  if (!details.line) {
    return null
  }

  return (
    <div>
      <ErrorCode size={1}>{`${details.line}\n${dashLine(
        details.column,
        details.columnEnd
      )}`}</ErrorCode>
      <Box marginTop={4}>
        <ErrorCode size={1}>{`Line:   ${details.lineNumber}\nColumn: ${details.column}`}</ErrorCode>
      </Box>
    </div>
  )
}

function mapToLegacyDetails(details) {
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

function dashLine(column, columnEnd) {
  const line = '-'.repeat(column)
  const hats = `^`.repeat(columnEnd ? columnEnd - column : 1)
  return `${line}${hats}`
}

export default QueryErrorDetails
