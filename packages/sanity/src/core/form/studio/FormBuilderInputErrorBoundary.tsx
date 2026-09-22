import {Card, Stack, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useState} from 'react'
import {Box} from 'ui5'
import {useHotModuleReload} from 'use-hot-module-reload'

import {agentDebugLog} from '../../../../test/browser/agentDebugLog'
import {ErrorBoundary} from '../../../ui-components/errorBoundary/ErrorBoundary'
import {SchemaError} from '../../config/SchemaError'
import {isDev} from '../../environment'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {isRecord} from '../../util/isRecord'
import {Alert} from '../components/Alert'

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
): React.JSX.Element {
  const {children} = props
  const [{error, info}, setError] = useState<{error: unknown; info: React.ErrorInfo}>({
    error: null,
    info: {},
  })
  const handleRetry = () => setError({error: null, info: {}})

  if (!error) {
    return <ErrorBoundary onCatch={setError}>{children}</ErrorBoundary>
  }

  return <ErrorCard error={error} info={info} onRetry={handleRetry} />
}

/**
 * The error UI is in a separate component to keep the wrapper lightweight,
 * it allows us to use hooks like useTranslation without incurring the cost of it on every form input
 * when there are no errors.
 * @internal
 */
export function ErrorCard(props: {error: unknown; info?: React.ErrorInfo; onRetry: () => void}) {
  const {error, info, onRetry} = props

  // #region agent log
  agentDebugLog({
    hypothesisId: 'D',
    location: 'FormBuilderInputErrorBoundary.tsx:ErrorCard:entry',
    message: 'ErrorCard render entry',
    data: {
      errorType: error == null ? 'nullish' : typeof error,
      isSchemaError: error instanceof SchemaError,
      hasMessage: isRecord(error) && typeof error.message === 'string',
    },
  })
  // #endregion

  // If a schema error, rethrow and let the StudioErrorBoundary handle it
  if (error instanceof SchemaError) {
    // #region agent log
    agentDebugLog({
      hypothesisId: 'D',
      location: 'FormBuilderInputErrorBoundary.tsx:ErrorCard:schemaError',
      message: 'ErrorCard rethrowing SchemaError',
      data: {},
    })
    // #endregion
    throw error
  }

  const {t} = useTranslation()
  const message = isRecord(error) && typeof error.message === 'string' && error.message
  const callStack = isRecord(error) && typeof error.stack === 'string' && error.stack
  const componentStack = typeof info?.componentStack === 'string' && info.componentStack

  // #region agent log
  agentDebugLog({
    hypothesisId: 'C',
    location: 'FormBuilderInputErrorBoundary.tsx:ErrorCard:afterTranslation',
    message: 'ErrorCard passed useTranslation',
    data: {
      message: typeof message === 'string' ? message : null,
      translatedSample: t('form.error.unhandled-runtime-error.error-message', {
        message: message || 'n/a',
      }),
    },
  })
  // #endregion

  useHotModuleReload(onRetry)

  return (
    <Alert status="error" title={<>{t('form.error.unhandled-runtime-error.title')}</>}>
      <Stack gap={4}>
        <Text as="p" muted size={1}>
          <>{t('form.error.unhandled-runtime-error.error-message', {message})}</>
        </Text>
        {callStack && (
          <Box key="call-stack">
            <Stack gap={2}>
              <Text as="p" size={1}>
                <>{t('form.error.unhandled-runtime-error.call-stack.title')}</>
              </Text>
              <Card border radius={2} overflow="auto" padding={4} tone="inherit">
                {callStack && (
                  <Code size={1} style={{maxHeight: '40vh'}}>
                    {callStack}
                  </Code>
                )}
              </Card>
            </Stack>
          </Box>
        )}
        {isDev && componentStack && (
          <Box key="component-stack">
            <Stack gap={2}>
              <Text as="p" size={1}>
                <>{t('form.error.unhandled-runtime-error.component-stack.title')}</>
              </Text>
              <Card border radius={2} overflow="auto" padding={4} tone="inherit">
                {componentStack && (
                  <Code size={1} style={{maxHeight: '40vh'}}>
                    {componentStack}
                  </Code>
                )}
              </Card>
            </Stack>
          </Box>
        )}
      </Stack>
    </Alert>
  )
}
