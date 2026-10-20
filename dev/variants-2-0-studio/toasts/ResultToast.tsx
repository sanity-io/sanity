import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Flex, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type ReactNode, useCallback, useState} from 'react'
import {createPortal} from 'react-dom'

import {useOptionState} from '../design-options/store'
import {eventById, PREVIEW_VALUES, type ToastEventId, toastCopy, type ToastValues} from './events'

// The result toast: the stock Studio toast (`useToast().push`) with the event copy and, where the event has one, an
// action in the description. The action comes in two looks, switched by the Design options "Toast action" setting:
//   button: a filled button at the bottom right (fill = the toast's foreground, label = its background, so it inverts in dark)
//   link:   an underlined text link under the message, aligned with the message text, with a trailing arrow
// One toast at a time: every result uses the same id, so a result replaces the one on screen and "in progress" is replaced by its result.

/** The stock toast layer's width (Storybook and Figma agree; 400 and a status icon are proposals, not approved). One line to change. */
export const TOAST_WIDTH = 380
/** The proposed toast (Look > Toast style > Proposed): a status icon, this width, an action slot at the end. Not approved for Studio. */
export const PROPOSED_TOAST_WIDTH = 400
/** The toast's own padding, and the action button's height (13px text + 7px padding twice). */
const TOAST_PADDING = 12
/** The close icon's right edge, from the toast's right edge. */
const CLOSE_ICON_EDGE = 6
const BUTTON_HEIGHT = 33
/** Where the title text starts after the status icon (measured), so the proposed toast indents the message and the link by this. */
const ICON_INDENT = 14
export const RESULT_TOAST_ID = 'variants-2-0-result'
const TONE_ICON = {
  positive: CheckmarkCircleIcon,
  caution: WarningOutlineIcon,
  critical: ErrorOutlineIcon,
  neutral: InfoOutlineIcon,
} as const
const STATUS = {
  positive: 'success',
  caution: 'warning',
  critical: 'error',
  neutral: 'info',
} as const

function ActionRow(props: {
  label: string
  look: 'button' | 'link'
  onAction?: () => void
  slot?: boolean
}) {
  const {label, look, onAction, slot} = props
  if (look === 'link') {
    return (
      <Box
        data-testid="toast-action-row"
        style={{marginTop: 6, paddingLeft: slot ? ICON_INDENT : 0}}
      >
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
  if (slot) return <ActionSlot label={label} onAction={onAction} />
  return <ActionButton label={label} onAction={onAction} />
}

/** The proposed toast's action slot: the button at the end of the content, in the toast's own flow (no portal). */
function ActionSlot(props: {label: string; onAction?: () => void}) {
  return (
    <div
      data-testid="toast-action-row"
      style={{display: 'flex', justifyContent: 'flex-end', marginTop: 10, width: '100%'}}
    >
      <button
        data-look="button"
        data-slot=""
        data-testid="toast-action"
        onClick={props.onAction}
        style={{
          background: 'var(--card-fg-color)',
          border: 0,
          borderRadius: 6,
          color: 'var(--card-bg-color)',
          cursor: 'pointer',
          font: 'inherit',
          fontSize: 13,
          fontWeight: 500,
          height: BUTTON_HEIGHT,
          padding: '7px 14px',
        }}
        type="button"
      >
        {props.label}
      </button>
    </div>
  )
}

/**
 * The button sits on the toast itself: the stock toast clips its description column before the close icon, and the description
 * is a positioning parent of its own, so the button is portalled into the toast's root and placed against it. It lands on the close
 * icon's right edge. A spacer in the description keeps the room (14px + the button's height) so the toast grows to hold it.
 */
function ActionButton(props: {label: string; onAction?: () => void}) {
  const [toast, setToast] = useState<Element | null>(null)
  const attach = useCallback(
    (el: HTMLDivElement | null) => setToast(el?.closest('[data-ui="Toast"]') ?? null),
    [],
  )
  return (
    <div
      data-testid="toast-action-row"
      ref={attach}
      style={{height: 14 + BUTTON_HEIGHT, width: '100%'}}
    >
      {toast
        ? createPortal(
            <button
              data-look="button"
              data-testid="toast-action"
              onClick={props.onAction}
              style={{
                background: 'var(--card-fg-color)',
                border: 0,
                borderRadius: 6,
                bottom: TOAST_PADDING,
                color: 'var(--card-bg-color)',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                height: BUTTON_HEIGHT,
                padding: '7px 14px',
                position: 'absolute',
                right: CLOSE_ICON_EDGE,
              }}
              type="button"
            >
              {props.label}
            </button>,
            toast,
          )
        : null}
    </div>
  )
}

/** The toast is the stock width; it is the positioning parent of the action button. */
export function ResultToastStyles() {
  const {toastStyle} = useOptionState()
  const width = toastStyle === 'proposed' ? PROPOSED_TOAST_WIDTH : TOAST_WIDTH
  return (
    <style data-testid="result-toast-styles">
      {`[data-ui="Toast"] { position: relative; width: ${width}px; max-width: calc(100vw - 32px); }`}
    </style>
  )
}

export interface ShowResultToast {
  (id: ToastEventId, values?: Partial<ToastValues>, onAction?: () => void): void
}

/** Push a result toast for an event. `values` fills the copy (variant name, document, counts). */
export function useResultToast(): ShowResultToast {
  const toast = useToast()
  const {toastAction, toastStyle} = useOptionState()
  const proposed = toastStyle === 'proposed'
  return useCallback(
    (id, values, onAction) => {
      const event = eventById(id)
      const copy = toastCopy(id, {...PREVIEW_VALUES, ...values})
      let description: ReactNode = copy.description ? (
        <div style={proposed ? {paddingLeft: ICON_INDENT} : undefined}>
          <Text size={1}>{copy.description}</Text>
        </div>
      ) : null
      if (event.action) {
        description = (
          <>
            {description}
            <ActionRow
              label={event.action}
              look={toastAction}
              onAction={onAction}
              slot={proposed}
            />
          </>
        )
      }
      const Icon = TONE_ICON[event.tone]
      toast.push({
        id: RESULT_TOAST_ID,
        status: STATUS[event.tone],
        title: proposed ? (
          <Flex align="center" data-testid="toast-icon" gap={2}>
            <Icon style={{flex: 'none', fontSize: 18}} />
            <span>{copy.title}</span>
          </Flex>
        ) : (
          copy.title
        ),
        description,
        closable: true,
        duration: event.duration,
      })
    },
    [toast, toastAction, proposed],
  )
}
