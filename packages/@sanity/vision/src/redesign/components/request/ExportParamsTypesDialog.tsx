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
  format: TypesExportFormat
  onClose: () => void
}

/** Types for the params a query uses, from the inference that builds the params form */
export function ExportParamsTypesDialog({query, format, onClose}: ExportParamsTypesDialogProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const inference = useParamsInference(query)

  const code = useMemo(() => {
    const typeName = toParamsTypeName(query)
    return format === 'typescript'
      ? printParamsTypeScript(inference.params, typeName)
      : printParamsZod(inference.params, typeName)
  }, [format, inference.params, query])

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
