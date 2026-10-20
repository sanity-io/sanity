import {Box, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type ReactNode, useCallback} from 'react'

import {useOptionState} from '../design-options/store'
import {eventById, PREVIEW_VALUES, type ToastEventId, toastCopy, type ToastValues} from './events'

// The result toast: the stock Studio toast (`useToast().push`) with the event copy and, where the event has one, an
// action in the description. The action comes in two looks, switched by the Design options "Toast action" setting:
//   button: a filled button at the bottom right (fill = the toast's foreground, label = its background, so it inverts in dark)
//   link:   an underlined text link under the message, aligned with the message text, with a trailing arrow
// One toast at a time: every result uses the same id, so a result replaces the one on screen and "in progress" is replaced by its result.

export const RESULT_TOAST_ID = 'variants-2-0-result'
const STATUS = {positive: 'success', caution: 'warning', critical: 'error', neutral: 'info'} as const

function ActionRow(props: {label: string; look: 'button' | 'link'; onAction?: () => void}) {
  const {label, look, onAction} = props
  if (look === 'link') {
    return (
      <Box data-testid="toast-action-row" style={{marginTop: 6}}>
        <button
          data-testid="toast-action"
          data-look="link"
          onClick={onAction}
          style={{
            background: 'none',
            border: 0,
            color: 'var(--card-muted-fg-color)',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 13,
            fontWeight: 500,
            padding: 0,
            textDecoration: 'underline',
          }}
          type="button"
        >
          {label} →
        </button>
      </Box>
    )
  }
  return (
    // The stock toast clips its description column before the close icon's column, so the button ends at the column's right edge,
    // a little left of the close icon (the drawn design puts it on the icon's edge; that needs a custom toast).
    <div data-testid="toast-action-row" style={{display: 'flex', justifyContent: 'flex-end', marginTop: 14, width: 355}}>
      <button
        data-testid="toast-action"
        data-look="button"
        onClick={onAction}
        style={{
          background: 'var(--card-fg-color)',
          border: 0,
          borderRadius: 6,
          color: 'var(--card-bg-color)',
          cursor: 'pointer',
          font: 'inherit',
          fontSize: 13,
          fontWeight: 500,
          padding: '7px 14px',
        }}
        type="button"
      >
        {label}
      </button>
    </div>
  )
}

/** The toast is 400px wide, as drawn. */
export function ResultToastStyles() {
  return <style data-testid="result-toast-styles">{'[data-ui="Toast"] { width: 400px; max-width: calc(100vw - 32px); }'}</style>
}

export interface ShowResultToast {
  (id: ToastEventId, values?: Partial<ToastValues>, onAction?: () => void): void
}

/** Push a result toast for an event. `values` fills the copy (variant name, document, counts). */
export function useResultToast(): ShowResultToast {
  const toast = useToast()
  const {toastAction} = useOptionState()
  return useCallback(
    (id, values, onAction) => {
      const event = eventById(id)
      const copy = toastCopy(id, {...PREVIEW_VALUES, ...values})
      let description: ReactNode = copy.description ? <Text size={1}>{copy.description}</Text> : null
      if (event.action) {
        description = (
          <>
            {description}
            <ActionRow label={event.action} look={toastAction} onAction={onAction} />
          </>
        )
      }
      toast.push({
        id: RESULT_TOAST_ID,
        status: STATUS[event.tone],
        title: copy.title,
        description,
        closable: true,
        duration: event.duration,
      })
    },
    [toast, toastAction],
  )
}
