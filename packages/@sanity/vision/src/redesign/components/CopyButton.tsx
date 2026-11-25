import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CopyIcon} from '@sanity/icons/Copy'
import {Button} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {useTranslation} from 'sanity/i18n'
import {VisuallyHidden} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'
import {VisionTooltip} from './VisionTooltip'

/** How long the button reads "Copied" after a copy */
export const COPIED_FEEDBACK_MS = 2000

export interface CopyButtonProps {
  /** Accessible label and tooltip, naming what it copies */
  label: string
  /** Resolves whether the text was copied */
  onCopy: () => Promise<boolean>
  disabled?: boolean
  testId?: string
}

/**
 * The icon-only Copy button of a pane header. It confirms the copy where the click happened
 * instead of with a toast: the copy icon turns into a checkmark, and its label into "Copied", for
 * a moment. A visually hidden live region announces that confirmation to screen readers.
 */
export function CopyButton({label, onCopy, disabled, testId = 'vision-copy'}: CopyButtonProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  // When the last copy succeeded, so a second copy while "Copied" shows keeps it longer
  const [copiedAt, setCopiedAt] = useState<number | null>(null)
  useEffect(() => {
    if (copiedAt === null) return undefined
    const timer = setTimeout(() => setCopiedAt(null), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [copiedAt])
  const copied = copiedAt !== null
  const shownLabel = copied ? t('vision.copied') : label

  const handleClick = async () => {
    if (await onCopy()) setCopiedAt(Date.now())
  }

  return (
    <>
      <VisionTooltip content={shownLabel} placement="bottom">
        <Button
          aria-label={shownLabel}
          data-copied={copied}
          data-testid={testId}
          disabled={disabled}
          fontSize={1}
          icon={copied ? CheckmarkIcon : CopyIcon}
          mode="bleed"
          onClick={() => void handleClick()}
          padding={2}
        />
      </VisionTooltip>
      <VisuallyHidden aria-live="polite">{copied ? t('vision.copied') : ''}</VisuallyHidden>
    </>
  )
}
