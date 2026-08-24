import {type ClientPerspective, isHttpError} from '@sanity/client'
import {Stack, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../i18n'
import {getUnsatisfiedApiVersionCapability} from '../util/apiVersionCapabilities'
import {prefixApiVersion} from '../util/prefixApiVersion'
import {QueryErrorDetails} from './QueryErrorDetails'
import {ErrorCode} from './QueryErrorDialog.styled'

interface QueryErrorDialogProps {
  error: Error
  apiVersion: string
  perspective: ClientPerspective | undefined
  variant: string | undefined
}

export function QueryErrorDialog(props: QueryErrorDialogProps) {
  const {error, apiVersion, perspective, variant} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const unsatisfiedCapability = getUnsatisfiedApiVersionCapability({
    statusCode: isHttpError(error) ? error.statusCode : undefined,
    apiVersion,
    perspective,
    variant,
  })

  return (
    <Stack gap={5} marginTop={2}>
      {unsatisfiedCapability ? (
        <Text data-testid="query-error-api-version-capability-hint" size={1}>
          {t(unsatisfiedCapability.explanationKey, {
            apiVersion: prefixApiVersion(unsatisfiedCapability.requiredApiVersion),
          })}
        </Text>
      ) : null}
      <ErrorCode size={1}>{error.message}</ErrorCode>
      <QueryErrorDetails error={error} />
    </Stack>
  )
}
