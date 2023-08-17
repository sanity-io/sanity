import React from 'react'
import {Box} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {visionLocaleNamespace} from '../../i18n'
import {ErrorCode} from './QueryErrorDialog.styled'

interface ContentLakeQueryError {
  details: {
    query: string
    start: number
    end: number

    lineNumber?: number
    column?: number
  }
}

export function QueryErrorDetails({error}: {error: ContentLakeQueryError | Error}) {
  const {t} = useTranslation(visionLocaleNamespace)

  if (!('details' in error)) {
    return null
  }

  const details = {...error.details, ...mapToLegacyDetails(error.details)}
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
        <ErrorCode size={1}>{`${t('query.error.line')}:   ${details.lineNumber}\n${t(
          'query.error.column'
        )}: ${details.column}`}</ErrorCode>
      </Box>
    </div>
  )
}

function mapToLegacyDetails(details: ContentLakeQueryError['details']) {
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

function dashLine(column: number, columnEnd: number | undefined): string {
  const line = '-'.repeat(column)
  const hats = `^`.repeat(columnEnd ? columnEnd - column : 1)
  return `${line}${hats}`
}
