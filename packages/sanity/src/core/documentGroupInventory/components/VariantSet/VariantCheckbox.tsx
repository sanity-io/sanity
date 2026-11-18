import {LockIcon} from '@sanity/icons/Lock'
import {Checkbox} from '@sanity/ui'
import {type MouseEvent} from 'react'
import {Icon} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'

/**
 * The selection checkbox at the far left of every inventory row and group header. It is always
 * there: quiet at rest, full contrast on hover, focus or when checked (see `VariantSetEntry`).
 *
 * A row's checkbox is not a tab stop of its own: the row is, and Space on it toggles the checkbox.
 * A group header has nothing else to focus, so its checkbox is a tab stop.
 *
 * A row or group that cannot be selected (its release is scheduled) shows a lock in the checkbox's
 * place, with a tooltip giving the reason and what to do, so the column keeps its shape. It keeps
 * the checkbox's name and tab stop, read with the reason; keyboard users also get the reason as the
 * row's description.
 *
 * @internal
 */
export function VariantCheckbox({
  label,
  checked,
  indeterminate,
  locked,
  blockedReason,
  tabbable = true,
  onChange,
}: {
  /** The accessible name, such as "Select Summer". */
  label: string
  checked: boolean
  indeterminate?: boolean
  /** Whether the selection is frozen, as it is while a deletion is in flight. */
  locked?: boolean
  /** Why this checkbox cannot be checked. Shown as a tooltip. */
  blockedReason?: string
  /** Whether the checkbox is a tab stop. A row's is not, since the row itself is. */
  tabbable?: boolean
  /** Called with the requested state, and whether Shift was held, for range selection. */
  onChange: (checked: boolean, options: {shiftKey: boolean}) => void
}) {
  if (blockedReason) {
    return (
      <Tooltip content={blockedReason}>
        <span
          aria-label={`${label}. ${blockedReason}`}
          className="selection-checkbox"
          data-blocked=""
          data-testid="selection-lock"
          role="img"
          tabIndex={tabbable ? 0 : -1}
        >
          {/*
           * The same icon, at the same size, as the lock on a scheduled release in the navbar's
           * releases menu. Its colour comes from the row (see VariantSetEntry): muted, or inverted
           * on the open row.
           */}
          <Icon icon={LockIcon} muted size={1} style={LOCK_STYLE} />
        </span>
      </Tooltip>
    )
  }

  return (
    <span className="selection-checkbox">
      <Checkbox
        aria-label={label}
        checked={checked}
        indeterminate={indeterminate}
        tabIndex={tabbable ? undefined : -1}
        readOnly={locked}
        onChange={(event) =>
          onChange(event.currentTarget.checked, {
            // A checkbox's change comes from a click, keyboard or pointer, which carries the modifier
            shiftKey: 'shiftKey' in event.nativeEvent && event.nativeEvent.shiftKey === true,
          })
        }
      />
    </span>
  )
}

function preventDefault(event: MouseEvent<HTMLInputElement>) {
  event.preventDefault()
}

function noop() {
  // A blocked checkbox never changes
}

/** Trimmed like the navbar menu's lock, so it takes the checkbox's place without growing the row. */
const LOCK_STYLE = {margin: '-0.375rem'} as const
