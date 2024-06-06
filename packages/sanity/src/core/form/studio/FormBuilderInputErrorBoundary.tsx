import {RefreshIcon} from '@sanity/icons'
import {Card, Code, ErrorBoundary, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useHotModuleReload} from 'use-hot-module-reload'

import {Button} from '../../../ui-components'
import {SchemaError} from '../../config'
import {isDev} from '../../environment'
import {useTranslation} from '../../i18n'
import {CorsOriginError} from '../../store'
import {isRecord} from '../../util'
import {Alert} from '../components/Alert'
import {Details} from '../components/Details'

/**
 * @internal
 */
interface FormBuilderInputErrorBoundaryProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export function FormBuilderInputErrorBoundary(
  props: FormBuilderInputErrorBoundaryProps,
): JSX.Element {
  const {children} = props
  const [{error}, setError] = useState<{error: unknown}>({error: null})
  const handleRetry = useCallback(() => setError({error: null}), [])

  if (!error) {
    return <ErrorBoundary onCatch={setError}>{children}</ErrorBoundary>
  }

  return <ErrorCard error={error} onRetry={handleRetry} />
}

/**
 * The error UI is in a separate component to keep the wrapper lightweight,
 * it allows us to use hooks like useTranslation without incurring the cost of it on every form input
 * when there are no errors.
 * @internal
 */
function ErrorCard(props: {error: unknown; onRetry: () => void}) {
  const {error, onRetry} = props

  // If a CORS error, or a schema error, rethrow and let the StudioErrorBoundary handle it
  if (error instanceof CorsOriginError || error instanceof SchemaError) {
    throw error
  }

  const {t} = useTranslation()
  const message = useMemo(
    () => isRecord(error) && typeof error.message === 'string' && error.message,
    [error],
  )
  const stack = useMemo(
    () => isRecord(error) && typeof error.stack === 'string' && error.stack,
    [error],
  )

  useHotModuleReload(onRetry)

  return (
    <Alert status="error" title={<>{t('form.error.unhandled-runtime-error.title')}</>}>
      <Stack space={4}>
        <Text as="p" muted size={1}>
          <>{t('form.error.unhandled-runtime-error.error-message', {message})}</>
        </Text>
        <Details open={isDev}>
          <Stack space={4}>
            <Text as="p" size={1}>
              <>{t('form.error.unhandled-runtime-error.details.title')}</>
            </Text>
            <Card border radius={2} overflow="auto" padding={4} tone="inherit">
              {stack && <Code size={1}>{stack}</Code>}
            </Card>
          </Stack>
        </Details>
        <div>
          <Button
            icon={RefreshIcon}
            onClick={onRetry}
            text={t('form.error.unhandled-runtime-error.retry-button-label')}
            tone="caution"
            mode="ghost"
          />
        </div>
      </Stack>
    </Alert>
  )
}
