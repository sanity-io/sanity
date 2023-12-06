import {Card, Code, Stack, Text} from '@sanity/ui'
import React from 'react'
import {ErrorPane} from '../../error'
import {Translate, isDev, useTranslation} from 'sanity'

interface FormLayoutErrorProps {
  currentMinWidth?: number
  documentType?: string
  minWidth?: number
  paneKey: string
  value?: Record<string, unknown>
}

export function FormLayoutError(props: FormLayoutErrorProps) {
  const {documentType, value, currentMinWidth, paneKey, minWidth} = props
  const {t} = useTranslation()

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
      <Stack space={4}>
        {documentType && (
          <Text as="p">
            <Translate
              t={t}
              i18nKey="panes.document-pane.document-unknown-type.text"
              values={{documentType}}
            />
          </Text>
        )}

        {!documentType && (
          <Text as="p">{t('panes.document-pane.document-unknown-type.without-schema.text')}</Text>
        )}

        {isDev && value && (
          /* eslint-disable i18next/no-literal-string */
          <>
            <Text as="p">Here is the JSON representation of the document:</Text>

            <Card padding={3} overflow="auto" radius={2} shadow={1} tone="inherit">
              <Code language="json" size={[1, 1, 2]}>
                {JSON.stringify(value, null, 2)}
              </Code>
            </Card>
          </>
          /* eslint-enable i18next/no-literal-string */
        )}
      </Stack>
    </ErrorPane>
  )
}
