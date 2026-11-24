import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CopyIcon} from '@sanity/icons/Copy'
import {Button} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {useTranslation} from 'sanity/i18n'

import {visionLocaleNamespace} from '../../i18n'
import * as styles from './redesign.module.css'

/** How long the button reads "Copied" after a copy */
export const COPIED_FEEDBACK_MS = 2000

export interface CopyButtonProps {
  /** Resolves whether the text was copied */
  onCopy: () => Promise<boolean>
  disabled?: boolean
  testId?: string
}

/**
 * The Copy button of a pane header. It confirms the copy where the click happened instead of
 * with a toast: the label turns into "Copied" and the copy icon into a checkmark for a moment.
 */
export function CopyButton({onCopy, disabled, testId = 'vision-copy'}: CopyButtonProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  // When the last copy succeeded, so a second copy while "Copied" shows keeps it longer
  const [copiedAt, setCopiedAt] = useState<number | null>(null)
  useEffect(() => {
    if (copiedAt === null) return undefined
    const timer = setTimeout(() => setCopiedAt(null), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [copiedAt])
  const copied = copiedAt !== null

  const handleClick = async () => {
    if (await onCopy()) setCopiedAt(Date.now())
  }

  return (
    <Button
      data-copied={copied}
      data-testid={testId}
      disabled={disabled}
      fontSize={1}
      gap={2}
      icon={
        <span className={styles.copyGlyphs} data-copied={copied}>
          <CopyIcon data-glyph="copy" />
          <CheckmarkIcon data-glyph="check" />
        </span>
      }
      mode="bleed"
      onClick={() => void handleClick()}
      padding={2}
      text={<span aria-live="polite">{copied ? t('vision.copied') : t('vision.copy')}</span>}
    />
  )
}
