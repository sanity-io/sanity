import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CopyIcon} from '@sanity/icons/Copy'
import {Button} from '@sanity/ui'
import {useEffect, useState} from 'react'

import * as styles from '../redesign.module.css'

/** How long the button shows its checkmark after a copy */
export const COPIED_FEEDBACK_MS = 1500

export interface CopyResultButtonProps {
  label: string
  disabled?: boolean
  /** Resolves whether the result was copied */
  onCopy: () => Promise<boolean>
  /** Icon only, for a row action. The result bar shows the label as the button text */
  iconOnly?: boolean
  testId?: string
}

/**
 * Copies the result from the response panel's bottom action bar, and confirms it where the click
 * happened: the copy icon turns into a checkmark for a moment, next to the toast the copy pushes.
 * A document row uses the same button as an icon.
 */
export function CopyResultButton({
  label,
  disabled,
  onCopy,
  iconOnly = false,
  testId = 'vision-copy-result',
}: CopyResultButtonProps) {
  // When the last copy succeeded, so a second copy while the checkmark shows keeps it longer
  const [copiedAt, setCopiedAt] = useState<number | null>(null)
  useEffect(() => {
    if (copiedAt === null) return undefined
    const timer = setTimeout(() => setCopiedAt(null), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [copiedAt])

  const handleClick = async () => {
    if (await onCopy()) setCopiedAt(Date.now())
  }

  return (
    <Button
      aria-label={iconOnly ? label : undefined}
      data-testid={testId}
      disabled={disabled}
      gap={2}
      icon={
        <span
          className={styles.copyGlyphs}
          data-copied={copiedAt !== null}
          data-testid={`${testId}-glyphs`}
        >
          <CopyIcon data-glyph="copy" />
          <CheckmarkIcon data-glyph="check" />
        </span>
      }
      mode={iconOnly ? 'bleed' : 'ghost'}
      onClick={() => void handleClick()}
      padding={2}
      text={iconOnly ? undefined : label}
    />
  )
}
