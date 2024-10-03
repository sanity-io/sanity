import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Card, DialogProvider, Flex, Stack, Text, TextInput, useToast} from '@sanity/ui'
import {useId, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, type Observable, of, startWith} from 'rxjs'
import {type Role, useClient, useProjectId, useTranslation, useZIndex} from 'sanity'
import {styled} from 'styled-components'

import {Dialog} from '../../../ui-components'
import {structureLocaleNamespace} from '../../i18n'
import {AskToEditRequestSent} from './__telemetry__/RequestPermissionDialog.telemetry'
import {type AccessRequest} from './useRoleRequestsStatus'

const MAX_NOTE_LENGTH = 150

/** @internal */
export const DialogBody = styled(Box)`
  box-sizing: border-box;
`

/** @internal */
export const LoadingContainer = styled(Flex).attrs({
  align: 'center',
  direction: 'column',
  justify: 'center',
})`
  height: 110px;
`

/** @internal */
export interface RequestPermissionDialogProps {
  onClose?: () => void
  onRequestSubmitted?: () => void
}

/**
 * A dialog that enables the user to request permission to change their
 * member role from "Viewer" to "Editor" or "Admin" depending on the
 * project's available roles.
 *
 * @internal
 */
export function RequestPermissionDialog({
  onClose,
  onRequestSubmitted,
}: RequestPermissionDialogProps) {
  const {t} = useTranslation(structureLocaleNamespace)
  const telemtry = useTelemetry()
  const dialogId = `request-permissions-${useId()}`
  const projectId = useProjectId()
  const client = useClient({apiVersion: '2024-09-26'})
  const toast = useToast()
  const zOffset = useZIndex()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [note, setNote] = useState('')

  const [msgError, setMsgError] = useState<string | undefined>()
  const [hasTooManyRequests, setHasTooManyRequests] = useState<boolean>(false)
  const [hasBeenDenied, setHasBeenDenied] = useState<boolean>(false)

  const requestedRole$: Observable<'administrator' | 'editor'> = useMemo(() => {
    const adminRole = 'administrator' as const
    if (!projectId || !client) return of(adminRole)
    return client.observable
      .request<(Role & {appliesToUsers?: boolean})[]>({url: `/projects/${projectId}/roles`})
      .pipe(
        map((roles) => {
          const hasEditor = roles
            .filter((role) => role?.appliesToUsers)
            .find((role) => role.name === 'editor')
          return hasEditor ? 'editor' : adminRole
        }),
        startWith(adminRole),
        catchError(() => of(adminRole)),
      )
  }, [projectId, client])

  const requestedRole = useObservable(requestedRole$)

  const onSubmit = () => {
    setIsSubmitting(true)
    client
      .request<AccessRequest | null>({
        url: `/access/project/${projectId}/requests`,
        method: 'post',
        body: {note, requestUrl: window?.location.href, requestedRole, type: 'role'},
      })
      .then((request) => {
        if (request) {
          if (onRequestSubmitted) onRequestSubmitted()
          telemtry.log(AskToEditRequestSent)
          toast.push({title: 'Edit access requested'})
        }
      })
      .catch((err) => {
        const statusCode = err?.response?.statusCode
        const errMessage = err?.response?.body?.message
        if (statusCode === 429) {
          // User is over their cross-project request limit
          setHasTooManyRequests(true)
          setMsgError(errMessage)
        }
        if (statusCode === 409) {
          // If we get a 409, user has been denied on this project or has a valid pending request
          // valid pending request should be handled by GET request above
          setHasBeenDenied(true)
          setMsgError(errMessage)
        } else {
          toast.push({
            title: 'There was a problem submitting your request.',
            status: 'error',
          })
        }
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  return (
    <DialogProvider position={'fixed'} zOffset={zOffset.fullscreen}>
      <Dialog
        width={1}
        id={dialogId}
        header={t('request-permission-dialog.header.text')}
        footer={{
          cancelButton: {
            onClick: onClose,
            text: t('confirm-dialog.cancel-button.fallback-text'),
          },
          confirmButton: {
            onClick: onSubmit,
            loading: isSubmitting,
            disabled: hasTooManyRequests || hasBeenDenied,
            text: t('request-permission-dialog.confirm-button.text'),
            tone: 'primary',
            type: 'submit',
          },
        }}
        onClose={onClose}
        onClickOutside={onClose}
      >
        <DialogBody>
          <Stack space={4}>
            <Text>{t('request-permission-dialog.description.text')}</Text>
            {hasTooManyRequests || hasBeenDenied ? (
              <Card tone={'caution'} padding={3} radius={2} shadow={1}>
                <Text size={1}>
                  {hasTooManyRequests && (
                    <>{msgError ?? t('request-permission-dialog.warning.limit-reached.text')}</>
                  )}
                  {hasBeenDenied && (
                    <>{msgError ?? t('request-permission-dialog.warning.denied.text')}</>
                  )}
                </Text>
              </Card>
            ) : (
              <Stack space={3} paddingBottom={0}>
                <TextInput
                  placeholder={t('request-permission-dialog.note-input.placeholder.text')}
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSubmit()
                  }}
                  maxLength={MAX_NOTE_LENGTH}
                  value={note}
                  onChange={(e) => {
                    setNote(e.currentTarget.value)
                  }}
                />

                <Text align="right" muted size={1}>{`${note.length}/${MAX_NOTE_LENGTH}`}</Text>
              </Stack>
            )}
          </Stack>
        </DialogBody>
      </Dialog>
    </DialogProvider>
  )
}
