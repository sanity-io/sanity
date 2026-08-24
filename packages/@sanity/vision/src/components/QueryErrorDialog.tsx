import {type ClientPerspective, isHttpError} from '@sanity/client'
import {Stack, Text} from '@sanity/ui'
import {RELEASES_STUDIO_CLIENT_OPTIONS, useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../i18n'
import {isIncompatibleReleasePerspectiveError} from '../util/isIncompatibleReleasePerspectiveError'
import {prefixApiVersion} from '../util/prefixApiVersion'
import {QueryErrorDetails} from './QueryErrorDetails'
import {ErrorCode} from './QueryErrorDialog.styled'

interface QueryErrorDialogProps {
  error: Error
  apiVersion: string
  perspective: ClientPerspective | undefined
}

export function QueryErrorDialog(props: QueryErrorDialogProps) {
  const {error, apiVersion, perspective} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const minimumApiVersion = prefixApiVersion(RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion)
  const showReleasePerspectiveHint = isIncompatibleReleasePerspectiveError({
    statusCode: isHttpError(error) ? error.statusCode : undefined,
    apiVersion,
    perspective,
    minimumApiVersion,
  })

  return (
    <Stack gap={5} marginTop={2}>
      {showReleasePerspectiveHint ? (
        <Text data-testid="query-error-release-perspective-hint" size={1}>
          {t('query.error.unsupported-release-perspective', {apiVersion: minimumApiVersion})}
        </Text>
      ) : null}
      <ErrorCode size={1}>{error.message}</ErrorCode>
      <QueryErrorDetails error={error} />
    </Stack>
  )
}
