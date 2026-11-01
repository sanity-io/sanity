import {Button, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useEffect} from 'react'
import {useTranslation} from 'sanity'
import {Flex} from 'ui5'
import {useEffectEvent} from 'use-effect-event'

import {visionLocaleNamespace} from '../../i18n'

const TOAST_ID = 'vision-redesign-invitation'

interface RedesignToastActionsProps {
  description: string
  acceptLabel: string
  dismissLabel: string
  onAccept: () => void
  onDismiss: () => void
}

/**
 * The toast's body. It renders in the studio's toast layer, which can sit outside the locale
 * provider that has Vision's strings, so it is handed them translated
 */
function RedesignToastActions(props: RedesignToastActionsProps) {
  const {description, acceptLabel, dismissLabel, onAccept, onDismiss} = props
  return (
    <Stack gap={3} paddingTop={1}>
      <Text size={1}>{description}</Text>
      <Flex gap={2}>
        <Button
          data-testid="vision-redesign-accept"
          fontSize={1}
          onClick={onAccept}
          padding={2}
          text={acceptLabel}
          tone="primary"
        />
        <Button
          data-testid="vision-redesign-dismiss"
          fontSize={1}
          mode="bleed"
          onClick={onDismiss}
          padding={2}
          text={dismissLabel}
        />
      </Flex>
    </Stack>
  )
}

export interface RedesignToastProps {
  onAccept: () => void
  onDismiss: () => void
}

/**
 * Invites the user to try the redesigned Vision. Renders nothing itself: it pushes a persistent
 * toast while mounted and removes it again on unmount, so it disappears as soon as the user opts
 * in or leaves the tool.
 */
export function RedesignToast({onAccept, onDismiss}: RedesignToastProps) {
  const toast = useToast()
  const {t} = useTranslation(visionLocaleNamespace)
  const accept = useEffectEvent(onAccept)
  const dismiss = useEffectEvent(onDismiss)

  useEffect(() => {
    // `@sanity/ui` toasts auto-dismiss unless the duration is infinite, and the provider does not
    // forward `onClose`, so the toast carries its own accept and dismiss buttons instead of an X
    const remove = () => {
      toast.push({id: TOAST_ID, duration: 0.01})
    }
    toast.push({
      id: TOAST_ID,
      closable: false,
      duration: Infinity,
      status: 'info',
      title: t('vision.redesign.toast.title'),
      description: (
        <RedesignToastActions
          acceptLabel={t('vision.redesign.toast.accept')}
          description={t('vision.redesign.toast.description')}
          dismissLabel={t('vision.redesign.toast.dismiss')}
          onAccept={() => {
            remove()
            accept()
          }}
          onDismiss={() => {
            remove()
            dismiss()
          }}
        />
      ),
    })
    return remove
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [t, toast])

  return null
}
