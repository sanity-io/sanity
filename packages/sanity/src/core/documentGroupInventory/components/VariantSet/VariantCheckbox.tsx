import {Checkbox} from '@sanity/ui'
import {type MouseEvent} from 'react'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'

/**
 * The selection checkbox at the far left of every inventory row and group header. It is always
 * there: quiet at rest, full contrast on hover, focus or when checked (see `VariantSetEntry`).
 *
 * A row that cannot be selected keeps its checkbox, dimmed and with a tooltip giving the reason,
 * so the column keeps its shape. The checkbox stays focusable, so the reason is reachable by
 * keyboard too; it only refuses to change.
 *
 * @internal
 */
export function VariantCheckbox({
  label,
  checked,
  indeterminate,
  locked,
  blockedReason,
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
  /** Called with the requested state, and whether Shift was held, for range selection. */
  onChange: (checked: boolean, options: {shiftKey: boolean}) => void
}) {
  if (blockedReason) {
    return (
      <Tooltip content={blockedReason}>
        <span className="selection-checkbox" data-blocked="">
          <Checkbox
            aria-label={label}
            aria-disabled="true"
            checked={false}
            // Read-only styling, without `disabled`, which would take it out of the tab order
            data-read-only=""
            onClick={preventDefault}
            onChange={noop}
          />
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
