import {Box, Card, DialogProvider, Flex, Stack, Text, TextInput, useToast} from '@sanity/ui'
import {useEffect, useId, useMemo, useState} from 'react'
import {type Role, useClient, useProjectId, useTranslation, useZIndex} from 'sanity'
import {styled} from 'styled-components'

import {type AccessRequest} from '../../../core/studio/screens'
import {Dialog} from '../../../ui-components'
import {structureLocaleNamespace} from '../../i18n'

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
 * A confirmation dialog used to prevent unwanted document deletes. Loads all
 * the referencing internal and cross-data references prior to showing the
 * delete button.
 *
 * @internal
 */
export function RequestPermissionDialog({
  onClose,
  onRequestSubmitted,
}: RequestPermissionDialogProps) {
  const {t} = useTranslation(structureLocaleNamespace)
  const dialogId = `request-permissions-${useId()}`
  const projectId = useProjectId()
  const client = useClient({apiVersion: '2024-09-26'})
  const toast = useToast()
  const zOffset = useZIndex()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [roles, setRoles] = useState<Role[]>()

  const [note, setNote] = useState('')
  const [noteLength, setNoteLength] = useState<number>(0)

  const [msgError, setMsgError] = useState<string | undefined>()
  const [hasTooManyRequests, setHasTooManyRequests] = useState<boolean>(false)
  const [hasBeenDenied, setHasBeenDenied] = useState<boolean>(false)

  //   Get the available roles for the project
  useEffect(() => {
    if (!projectId || !client) return
    client
      .request({
        url: `/projects/${projectId}/roles`,
        method: 'get',
      })
      .then((data) => setRoles(data))
  }, [projectId, client])

  //   Set a default requestedRole based on the available roles
  const requestedRole = useMemo(() => {
    const hasEditor = roles?.find((role) => role.name === 'editor')
    return hasEditor ? 'Editor' : 'Administrator'
  }, [roles])

  const onConfirm = () => {
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
            status: errMessage,
          })
        }
      })
      .finally(() => {
        setIsSubmitting(false)
      })
    setIsSubmitting(false)
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
            loading: isSubmitting,
            disabled: hasTooManyRequests || hasBeenDenied,
            text: t('request-permission-dialog.confirm-button.text'),
            tone: 'primary',
            onClick: onConfirm,
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
                    if (e.key === 'Enter') onConfirm()
                  }}
                  maxLength={MAX_NOTE_LENGTH}
                  value={note}
                  onChange={(e) => {
                    setNote(e.currentTarget.value)
                    setNoteLength(e.currentTarget.value.length)
                  }}
                />

                <Text align="right" muted size={1}>{`${noteLength}/${MAX_NOTE_LENGTH}`}</Text>
              </Stack>
            )}
          </Stack>
        </DialogBody>
      </Dialog>
    </DialogProvider>
  )
}
