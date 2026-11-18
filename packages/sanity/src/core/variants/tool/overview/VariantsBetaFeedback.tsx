import {CloseIcon} from '@sanity/icons/Close'
import {FeedbackIcon} from '@sanity/icons/Feedback'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Card} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {Flex, Icon, Text} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {STUDIO_DSN} from '../../../error/sentry/sentryErrorReporter'
import {StudioFeedbackDialog} from '../../../feedback/components/StudioFeedbackDialog'
import {useFeedbackTelemetry} from '../../../feedback/hooks/useFeedbackTelemetry'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../../i18n'

/**
 * The `source` tag on feedback sent from the Variants tool. The version inventory sends
 * `document-group-inventory`, so each surface can be told apart where the feedback arrives.
 */
const VARIANTS_TOOL_FEEDBACK_SOURCE = 'variants-tool'

const DISMISSED_KEY = 'sanityStudio:variants:open-beta-feedback-banner:dismissed:v1'

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === 'true'
  } catch {
    return false
  }
}

function writeDismissed(): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, 'true')
  } catch {
    // Storage can be blocked. The banner then comes back on the next visit, which is harmless.
  }
}

/**
 * State for the open beta feedback entry points in the Variants tool: the banner shows until the
 * person dismisses it, in this browser, and after that an icon in the header opens the same
 * dialog.
 *
 * @internal
 */
export function useVariantsBetaFeedback() {
  const [bannerDismissed, setBannerDismissed] = useState(readDismissed)
  const [dialogOpen, setDialogOpen] = useState(false)
  const {feedbackDialogOpened} = useFeedbackTelemetry()

  const dismissBanner = useCallback(() => {
    writeDismissed()
    setBannerDismissed(true)
  }, [])
  const openDialog = useCallback(() => {
    feedbackDialogOpened()
    setDialogOpen(true)
  }, [feedbackDialogOpened])
  const closeDialog = useCallback(() => setDialogOpen(false), [])

  return {bannerDismissed, dialogOpen, dismissBanner, openDialog, closeDialog}
}

/**
 * The open beta banner above the variant definitions: "Content Variants is in open beta. Share
 * feedback with Sanity". The link opens the feedback dialog and the close button dismisses it.
 *
 * @internal
 */
export function VariantsBetaBanner(props: {onDismiss: () => void; onFeedback: () => void}) {
  const {onDismiss, onFeedback} = props
  const {t} = useTranslation(variantsLocaleNamespace)

  return (
    <Card
      data-testid="variants-beta-banner"
      flex="none"
      marginBottom={3}
      paddingLeft={3}
      paddingRight={1}
      paddingY={1}
      radius={3}
      tone="suggest"
    >
      <Flex alignItems="center" gap={3}>
        <Icon icon={InfoOutlineIcon} muted size={0} tone="suggest" />
        <Flex flexGrow={1} paddingY={2} style={{minWidth: 0}}>
          <Text size={1}>
            {t('overview.beta-banner.text')}{' '}
            <button
              data-testid="variants-beta-banner-feedback"
              onClick={onFeedback}
              style={LINK_BUTTON_STYLE}
              type="button"
            >
              {t('overview.beta-banner.feedback-link')}
            </button>
          </Text>
        </Flex>
        <Button
          aria-label={t('overview.beta-banner.dismiss')}
          data-testid="variants-beta-banner-dismiss"
          icon={CloseIcon}
          mode="bleed"
          onClick={onDismiss}
          tone="suggest"
          tooltipProps={{content: t('overview.beta-banner.dismiss')}}
        />
      </Flex>
    </Card>
  )
}

/** A link in the sentence that acts as a button: it opens a dialog, it does not navigate. */
const LINK_BUTTON_STYLE = {
  appearance: 'none',
  background: 'none',
  border: 0,
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textDecoration: 'underline',
} as const

/**
 * The header icon that opens the feedback dialog once the banner is dismissed.
 *
 * @internal
 */
export function VariantsFeedbackButton(props: {onClick: () => void}) {
  const {t} = useTranslation()
  return (
    <Button
      aria-label={t('content-variants.feedback.action')}
      data-testid="variants-feedback-button"
      icon={FeedbackIcon}
      mode="bleed"
      onClick={props.onClick}
      tooltipProps={{content: t('content-variants.feedback.action')}}
    />
  )
}

/**
 * The feedback dialog with the Content Variants text, sending with the Variants tool's source.
 *
 * @internal
 */
export function VariantsFeedbackDialog(props: {onClose: () => void}) {
  const {t} = useTranslation()
  return (
    <StudioFeedbackDialog
      dsn={STUDIO_DSN}
      feedbackVersion="1"
      onClose={props.onClose}
      sentimentLabel={t('content-variants.feedback.sentiment-label')}
      source={VARIANTS_TOOL_FEEDBACK_SOURCE}
      title={t('content-variants.feedback.title')}
    />
  )
}
