import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CopyIcon} from '@sanity/icons/Copy'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type MouseEvent, type ReactElement, useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'sanity/i18n'
import {useIntentLink} from 'sanity/router'

import {visionLocaleNamespace} from '../i18n'
import {COPIED_FEEDBACK_MS} from '../redesign/components/response/CopyResultButton'
import * as styles from './ResultView.module.css'

/**
 * The actions of one line of the result tree: copy its value and, on an `_id` or `_ref`, edit the
 * document it names. They follow the value, take the same room whether shown or not, and show
 * while the line is hovered or one of them is focused.
 */
export function ResultViewRowActions(props: {
  copyLabel: string
  onCopy: () => Promise<boolean>
  /** The document ID to open with an edit intent */
  editId?: string
}) {
  const {copyLabel, onCopy, editId} = props
  return (
    <span className={styles.rowActions} data-testid="result-row-actions">
      <CopyValueButton label={copyLabel} onCopy={onCopy} />
      {editId ? <EditDocumentButton id={editId} /> : null}
    </span>
  )
}

function CopyValueButton({label, onCopy}: {label: string; onCopy: () => Promise<boolean>}) {
  const {t} = useTranslation(visionLocaleNamespace)
  // When the last copy succeeded, so a second copy while the checkmark shows keeps it longer
  const [copiedAt, setCopiedAt] = useState<number | null>(null)
  useEffect(() => {
    if (copiedAt === null) return undefined
    const timer = setTimeout(() => setCopiedAt(null), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [copiedAt])
  const copied = copiedAt !== null

  const handleClick = async (event: MouseEvent) => {
    // The button sits in the line's label, which toggles the node when clicked
    event.preventDefault()
    event.stopPropagation()
    if (await onCopy()) setCopiedAt(Date.now())
  }

  return (
    <RowActionTooltip label={copied ? t('vision.copied') : label}>
      <button
        aria-label={label}
        className={styles.rowActionButton}
        data-copied={copied}
        data-testid="result-copy-node"
        onClick={(event) => void handleClick(event)}
        type="button"
      >
        {copied ? <CheckmarkIcon /> : <CopyIcon />}
      </button>
    </RowActionTooltip>
  )
}

function EditDocumentButton({id}: {id: string}) {
  const {t} = useTranslation(visionLocaleNamespace)
  const params = useMemo(() => ({id}), [id])
  const {href, onClick} = useIntentLink({intent: 'edit', params})
  const label = t('vision.result.edit-document')
  return (
    <RowActionTooltip label={label}>
      <a
        aria-label={label}
        className={styles.rowActionButton}
        data-testid="result-edit-document"
        href={href}
        onClick={(event) => {
          // Keeps the line's label from toggling the node; the intent link navigates
          event.stopPropagation()
          onClick(event)
        }}
      >
        <LaunchIcon />
      </a>
    </RowActionTooltip>
  )
}

/**
 * A large result has thousands of these buttons, and every enabled tooltip keeps a floating card
 * mounted in a portal. A tooltip is enabled once its button is first hovered or focused, which is
 * also what opens it, and stays enabled so the button is never remounted under the pointer or focus.
 */
function RowActionTooltip({label, children}: {label: string; children: ReactElement}) {
  const [armed, setArmed] = useState(false)
  const arm = () => setArmed(true)
  return (
    <Tooltip
      animate
      content={
        <Text as="div" size={1}>
          {label}
        </Text>
      }
      disabled={!armed}
      placement="top"
      portal
    >
      <span className={styles.rowActionTarget} onFocus={arm} onMouseEnter={arm}>
        {children}
      </span>
    </Tooltip>
  )
}
