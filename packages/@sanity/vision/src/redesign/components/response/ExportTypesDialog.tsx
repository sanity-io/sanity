import {useMemo} from 'react'
import {useSchema} from 'sanity'
import {useTranslation} from 'sanity/i18n'

import {parseParams} from '../../../components/ParamsEditor'
import {visionLocaleNamespace} from '../../../i18n'
import {type VisionTab} from '../../store/types'
import {toQueryConstantName} from '../../util/exportSnippets'
import {evaluateQueryType} from '../../util/typegen/evaluateQueryType'
import {printTypeScript} from '../../util/typegen/printTypeScript'
import {printZod} from '../../util/typegen/printZod'
import {toTypeName} from '../../util/typegen/schemaTypes'
import {ExportCodeDialog} from '../ExportCodeDialog'

export type TypesExportFormat = 'typescript' | 'zod'

export interface ExportTypesDialogProps {
  tab: VisionTab
  format: TypesExportFormat
  result: unknown
  hasResult: boolean
  /** Only a result fetched for the current query and params may stand in for the schema */
  resultIsCurrent: boolean
  onClose: () => void
}

/** `AUTHOR_QUERY` becomes `AuthorQueryResult` */
function toResultTypeName(query: string): string {
  const constant = toQueryConstantName(query)
  return `${toTypeName(constant.toLowerCase().replace(/_/g, ' '))}Result`
}

export function ExportTypesDialog({
  tab,
  format,
  result,
  hasResult,
  resultIsCurrent,
  onClose,
}: ExportTypesDialogProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const schema = useSchema()

  const output = useMemo(() => {
    const params = parseParams(tab.rawParams, t)
    const evaluation = evaluateQueryType({
      query: tab.query,
      params: params.parsed || {},
      schema,
      hasResult: hasResult && resultIsCurrent,
      result,
    })
    if (evaluation.source === 'none') {
      return {source: evaluation.source, code: undefined, schemaError: evaluation.schemaError}
    }
    const typeName = toResultTypeName(tab.query)
    const code =
      format === 'typescript'
        ? printTypeScript(evaluation.node, {typeName, schema: evaluation.schema})
        : printZod(evaluation.node, {typeName, schema: evaluation.schema})
    return {
      source: evaluation.source,
      code,
      schemaError: evaluation.source === 'result' ? evaluation.schemaError : undefined,
    }
  }, [format, hasResult, result, resultIsCurrent, schema, t, tab.query, tab.rawParams])

  const sourceNote =
    output.source === 'schema'
      ? t('vision.export-types.source.schema')
      : output.source === 'result'
        ? t('vision.export-types.source.result')
        : hasResult
          ? t('vision.export-types.stale-result')
          : t('vision.export-types.empty')

  return (
    <ExportCodeDialog
      code={output.code}
      header={
        format === 'typescript'
          ? t('vision.export-types.title-typescript')
          : t('vision.export-types.title-zod')
      }
      id="vision-export-types"
      note={sourceNote}
      onClose={onClose}
      warning={
        output.schemaError
          ? {
              testId: 'vision-export-types-schema-error',
              text: t('vision.export-types.schema-error', {message: output.schemaError.message}),
            }
          : undefined
      }
    />
  )
}
