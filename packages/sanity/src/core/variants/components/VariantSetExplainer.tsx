import {Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {variantsLocaleNamespace} from '../i18n'

// Shared across the overview and the create dialog: once dismissed in one place, it stays dismissed
// everywhere for this browser. localStorage is intentional (no backend/schema for a spike).
const STORAGE_KEY = 'sanity-studio.variants.set-explainer.dismissed'

function readDismissed(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * A dismissible, self-teaching card explaining the variant-set mental model (define dimensions →
 * every combination becomes a definition → editing the set updates all, editing one forks it).
 * Dismissal persists per-browser.
 *
 * @internal
 */
export function VariantSetExplainer() {
  const {t} = useTranslation(variantsLocaleNamespace)
  const [dismissed, setDismissed] = useState(readDismissed)

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // Ignore storage failures (private mode, quota) — the card just reappears next time.
    }
  }, [])

  if (dismissed) {
    return null
  }

  return (
    <Card border data-testid="variant-set-explainer" padding={3} radius={2} tone="primary">
      <Flex align="flex-start" gap={3}>
        <Stack flex={1} space={3}>
          <Text size={1} weight="semibold">
            {t('explainer.title')}
          </Text>
          <Stack space={2}>
            <Text muted size={1}>
              1. {t('explainer.step1')}
            </Text>
            <Text muted size={1}>
              2. {t('explainer.step2')}
            </Text>
            <Text muted size={1}>
              3. {t('explainer.step3')}
            </Text>
          </Stack>
        </Stack>
        <Button
          data-testid="variant-set-explainer-dismiss"
          mode="bleed"
          onClick={handleDismiss}
          text={t('explainer.dismiss')}
          type="button"
        />
      </Flex>
    </Card>
  )
}
