import type {InvalidValueResolution} from '@sanity/portable-text-editor'
import {Box, Button, Card, Code, Grid, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {Translate, useTranslation} from '../../../i18n'
import {Alert} from '../../components/Alert'

interface InvalidValueProps {
  onChange: (...args: any[]) => any
  onIgnore: () => void
  readOnly?: boolean
  resolution: InvalidValueResolution
}

export function InvalidValue(props: InvalidValueProps) {
  const {onChange, onIgnore, resolution, readOnly} = props

  const {t} = useTranslation()
  const handleAction = useCallback(() => {
    if (resolution) {
      onChange({type: 'mutation', patches: resolution.patches})
    }
  }, [onChange, resolution])

  if (!resolution) return null

  return (
    <Alert
      title={<>{t('inputs.portable-text.invalid-value.title')}</>}
      suffix={
        <Stack padding={2}>
          {resolution.action && (
            <Grid columns={[1, 2]} gap={1}>
              <Button
                mode="ghost"
                onClick={onIgnore}
                text={t('inputs.portable-text.invalid-value.ignore-button.text')}
              />
              {!readOnly && (
                <Button
                  onClick={handleAction}
                  text={
                    <Translate
                      t={t}
                      i18nKey={resolution.i18n.action}
                      values={resolution.i18n.values}
                    />
                  }
                  tone="caution"
                />
              )}
            </Grid>
          )}

          <Box padding={3}>
            {resolution.action && (
              <Text as="p" muted size={1}>
                {t('inputs.portable-text.invalid-value.action-disclaimer')}
              </Text>
            )}
          </Box>
        </Stack>
      }
    >
      <Stack space={3}>
        <Text as="p" muted size={1}>
          <Translate t={t} i18nKey={resolution.i18n.description} values={resolution.i18n.values} />
        </Text>

        <Card border overflow="auto" padding={2} tone="inherit">
          <Code language="json">{JSON.stringify(resolution.item, null, 2)}</Code>
        </Card>
      </Stack>
    </Alert>
  )
}
