import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CopyIcon} from '@sanity/icons/Copy'
import {Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useEffect, useState} from 'react'

import * as styles from '../vista.module.css'

/** How long the button shows its checkmark after a copy */
export const COPIED_FEEDBACK_MS = 1500

export interface CopyResultButtonProps {
  label: string
  /** Resolves whether the result was copied */
  onCopy: () => Promise<boolean>
}

/**
 * Copies the result, and confirms it where the click happened: the copy icon turns into a
 * checkmark for a moment, next to the toast the copy pushes
 */
export function CopyResultButton({label, onCopy}: CopyResultButtonProps) {
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
    <Tooltip animate content={<Text size={1}>{label}</Text>} placement="bottom" portal>
      <Button
        aria-label={label}
        className={styles.pressable}
        data-testid="vista-copy-result"
        fontSize={1}
        icon={
          <span
            className={styles.copyGlyphs}
            data-copied={copiedAt !== null}
            data-testid="vista-copy-result-glyphs"
          >
            <CopyIcon data-glyph="copy" />
            <CheckmarkIcon data-glyph="check" />
          </span>
        }
        mode="bleed"
        onClick={() => void handleClick()}
        padding={2}
      />
    </Tooltip>
  )
}
