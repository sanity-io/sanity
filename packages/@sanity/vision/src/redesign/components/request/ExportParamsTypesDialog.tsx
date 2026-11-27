import {useMemo} from 'react'
import {useTranslation} from 'sanity/i18n'

import {visionLocaleNamespace} from '../../../i18n'
import {useParamsInference} from '../../hooks/useParamsInference'
import {
  printParamsTypeScript,
  printParamsZod,
  toParamsTypeName,
} from '../../util/typegen/printParams'
import {ExportCodeDialog} from '../ExportCodeDialog'
import {type TypesExportFormat} from '../response/ExportTypesDialog'

export interface ExportParamsTypesDialogProps {
  query: string
  /** The params' current values: a param the query says nothing about is typed from its value */
  params: Record<string, unknown>
  format: TypesExportFormat
  onClose: () => void
}

/** Types for the params a query uses, from the inference that builds the params form */
export function ExportParamsTypesDialog({
  query,
  params,
  format,
  onClose,
}: ExportParamsTypesDialogProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const inference = useParamsInference(query, params)

  const code = useMemo(() => {
    const options = {typeName: toParamsTypeName(query), schema: inference.groqSchema}
    return format === 'typescript'
      ? printParamsTypeScript(inference.params, options)
      : printParamsZod(inference.params, options)
  }, [format, inference.groqSchema, inference.params, query])

  return (
    <ExportCodeDialog
      code={code}
      header={
        format === 'typescript'
          ? t('vision.params.export.title-typescript')
          : t('vision.params.export.title-zod')
      }
      id="vision-export-params"
      note={
        inference.schemaUnavailable
          ? t('vision.params.export.source-no-schema')
          : t('vision.params.export.source')
      }
      onClose={onClose}
      warning={
        inference.syntaxError
          ? {
              testId: 'vision-export-params-syntax-error',
              text: t('vision.params.export.syntax-error'),
            }
          : undefined
      }
    />
  )
}
