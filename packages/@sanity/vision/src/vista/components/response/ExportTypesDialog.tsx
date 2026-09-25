import {CopyIcon} from '@sanity/icons/Copy'
import {Button, Card, Dialog, Stack, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useMemo} from 'react'
import {useSchema, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {parseParams} from '../../../components/ParamsEditor'
import {visionLocaleNamespace} from '../../../i18n'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {type VistaTab} from '../../store/types'
import {toQueryConstantName} from '../../util/exportSnippets'
import {evaluateQueryType} from '../../util/typegen/evaluateQueryType'
import {printTypeScript} from '../../util/typegen/printTypeScript'
import {printZod} from '../../util/typegen/printZod'
import {toTypeName} from '../../util/typegen/schemaTypes'
import {codeBlock} from '../vista.css'

export type TypesExportFormat = 'typescript' | 'zod'

export interface ExportTypesDialogProps {
  tab: VistaTab
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
  const copyToClipboard = useCopyToClipboard()
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
      ? t('vista.export-types.source.schema')
      : output.source === 'result'
        ? t('vista.export-types.source.result')
        : hasResult
          ? t('vista.export-types.stale-result')
          : t('vista.export-types.empty')

  return (
    <Dialog
      data-testid="vista-export-types-dialog"
      header={
        format === 'typescript'
          ? t('vista.export-types.title-typescript')
          : t('vista.export-types.title-zod')
      }
      id="vista-export-types-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      width={2}
    >
      <Box padding={4}>
        <Stack gap={4}>
          <Text data-testid="vista-export-types-source" muted size={1}>
            {sourceNote}
          </Text>
          {output.schemaError && (
            <Card border padding={3} radius={2} tone="caution">
              <Text data-testid="vista-export-types-schema-error" size={1}>
                {t('vista.export-types.schema-error', {message: output.schemaError.message})}
              </Text>
            </Card>
          )}
          {output.code && (
            <>
              <Card
                border
                className={codeBlock}
                overflow="auto"
                padding={3}
                radius={2}
                tone="transparent"
              >
                <Code data-testid="vista-export-types-code" language="typescript" size={1}>
                  {output.code}
                </Code>
              </Card>
              <Flex justifyContent="flex-end">
                <Button
                  icon={CopyIcon}
                  mode="ghost"
                  onClick={() => void copyToClipboard(output.code, t('vista.export-types.copied'))}
                  text={t('vista.export-types.copy')}
                />
              </Flex>
            </>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
