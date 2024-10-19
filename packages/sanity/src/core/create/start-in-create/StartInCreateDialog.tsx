import {LaunchIcon} from '@sanity/icons'
import {Box, Checkbox, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useId} from 'react'

import {Button} from '../../../ui-components'
import {set, toMutationPatches} from '../../form'
import {useDocumentOperation} from '../../hooks'
import {useTranslation} from '../../i18n'
import {useCurrentUser, useUser} from '../../store'
import {CreateLearnMoreButton} from '../components/CreateLearnMoreButton'
import {createLocaleNamespace} from '../i18n'
import {type CreateLinkMetadata} from '../types'
import {useCreateLinkUrl} from '../useCreateDocumentUrl'
import {StartInCreateSvg} from './StartInCreateSvg'

export const CREATE_LINK_TARGET = 'create'

export interface StartInCreateDialogProps {
  publicId: string
  createLinkId: string
  appId: string
  type: string
  onLinkingStarted: () => void
}

export function StartInCreateDialog(props: StartInCreateDialogProps) {
  const {publicId, createLinkId, appId, type, onLinkingStarted} = props
  const {t} = useTranslation(createLocaleNamespace)
  const checkboxId = useId()

  const {patch} = useDocumentOperation(publicId, type)

  const currentUser = useCurrentUser()
  const userId = currentUser?.id ?? ''
  const [user] = useUser(userId)

  const createUrl = useCreateLinkUrl({
    appId,
    documentType: type,
    docId: createLinkId,
    globalUserId: user?.sanityUserId,
  })

  const startLinking = useCallback(() => {
    if (!createUrl) {
      //@todo error toast
      return
    }
    window?.open(createUrl, CREATE_LINK_TARGET)?.focus()
    onLinkingStarted()

    //@todo delete me
    setTimeout(() => {
      patch.execute(
        toMutationPatches([
          set(
            {
              _id: 'dummy',
              userId: 'dummy',
              host: 'dummy',
              ejected: false,
              dataset: 'dummy',
            } satisfies CreateLinkMetadata,
            ['_create'],
          ),
        ]),
      )
    }, 2000)
  }, [patch, createUrl, onLinkingStarted])

  return (
    <Stack space={4}>
      <Box>
        <StartInCreateSvg />
      </Box>
      <Box>
        <Text weight="semibold">{t('start-in-create-dialog.lede')}</Text>
      </Box>
      <Box>
        <Text>{t('start-in-create-dialog.details')}</Text>
      </Box>
      <Flex gap={2} align="center">
        <Checkbox id={checkboxId} />
        <Text as="label" htmlFor={checkboxId}>
          {t('start-in-create-dialog.dont-remind-me-checkbox')}
        </Text>
      </Flex>
      <Flex justify="flex-end" gap={2}>
        <Box>
          <CreateLearnMoreButton />
        </Box>
        <Box>
          <Button
            text={t('start-in-create-dialog.cta.continue')}
            tone="primary"
            iconRight={LaunchIcon}
            onClick={startLinking}
          />
        </Box>
      </Flex>
    </Stack>
  )
}
