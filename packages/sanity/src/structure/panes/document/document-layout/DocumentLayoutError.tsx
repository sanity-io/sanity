import {Card} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {Translate, useTranslation} from 'sanity'
import {Text, VStack} from 'ui5'

import {isDev} from '../../../../core/environment'
import {structureLocaleNamespace} from '../../../i18n'
import {ErrorPane} from '../../error'

interface DocumentLayoutErrorProps {
  currentMinWidth?: number
  documentType?: string
  minWidth?: number
  paneKey: string
  value?: Record<string, unknown>
}

export function DocumentLayoutError(props: DocumentLayoutErrorProps) {
  const {documentType, value, currentMinWidth, paneKey, minWidth} = props
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <ErrorPane
      currentMinWidth={currentMinWidth}
      flex={2.5}
      minWidth={minWidth}
      paneKey={paneKey}
      title={
        <Translate
          t={t}
          i18nKey="panes.document-pane.document-unknown-type.title"
          values={{documentType}}
        />
      }
      tone="caution"
    >
      <VStack gap={4}>
        {documentType && (
          <Text as="p" trim={true}>
            <Translate
              t={t}
              i18nKey="panes.document-pane.document-unknown-type.text"
              values={{documentType}}
            />
          </Text>
        )}

        {!documentType && (
          <Text as="p" trim={true}>
            {t('panes.document-pane.document-unknown-type.without-schema.text')}
          </Text>
        )}

        {isDev && value && (
          /* oxlint-disable i18next/no-literal-string */
          <>
            <Text as="p" trim={true}>
              Here is the JSON representation of the document:
            </Text>

            <Card padding={3} overflow="auto" radius={2} shadow={1} tone="inherit">
              <Code language="json" size={[1, 1, 2]}>
                {JSON.stringify(value, null, 2)}
              </Code>
            </Card>
          </>
          /* oxlint-enable i18next/no-literal-string */
        )}
      </VStack>
    </ErrorPane>
  )
}
