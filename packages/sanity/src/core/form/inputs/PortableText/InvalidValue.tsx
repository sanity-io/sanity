import {type InvalidValueResolution} from '@portabletext/editor'
import {useTelemetry} from '@sanity/telemetry/react'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button,
  Card,
  Code,
  Grid,
  Stack,
  Text,
} from '@sanity/ui'
import {useCallback} from 'react'

import {Translate, useTranslation} from '../../../i18n'
import {
  PortableTextInvalidValueIgnore,
  PortableTextInvalidValueResolve,
} from '../../__telemetry__/form.telemetry'
import {Alert} from '../../components/Alert'

interface InvalidValueProps {
  onChange: (...args: any[]) => any
  onIgnore: () => void
  readOnly?: boolean
  resolution: InvalidValueResolution
}

export function InvalidValue(props: InvalidValueProps) {
  const {onChange, onIgnore, resolution, readOnly} = props
  const telemetry = useTelemetry()

  const {t} = useTranslation()

  const handleAction = useCallback(() => {
    if (resolution) {
      onChange({type: 'mutation', patches: resolution.patches})
      telemetry.log(PortableTextInvalidValueResolve, {
        PTEInvalidValueId: resolution.i18n.description,
        PTEInvalidValueDescription: resolution.description,
      })
    }
  }, [onChange, resolution, telemetry])

  const handleOnIgnore = useCallback(() => {
    telemetry.log(PortableTextInvalidValueIgnore)
    onIgnore()
  }, [onIgnore, telemetry])

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
                onClick={handleOnIgnore}
                text={t('inputs.portable-text.invalid-value.ignore-button.text')}
              />
              {/* @todo: use plain string */}
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
