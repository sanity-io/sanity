import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {
  // oxlint-disable-next-line no-restricted-imports
  Button, // Restricted Button: needs textWeight="regular", which the ui-components wrapper does not expose.
} from '@sanity/ui'

// The bleed back-button carries its own horizontal padding, which would push the label right of the
// title/table left edge. Cancel that padding so the button sits on the same hard left line as
// everything below it, framing the pane.
const BACK_ALIGN_STYLE = {marginLeft: -8}

/**
 * `← Back to all <X>` — the single back affordance at the top-left of a detail page. The entity
 * title headlines the pane below, so the back control does not repeat it; it only says where "back"
 * goes. Shared by the Releases and Variant-definition detail pages so both read as one family.
 *
 * @internal
 */
export function DetailBackButton(props: {
  text: string
  onClick: () => void
  testId?: string
}): React.JSX.Element {
  const {text, onClick, testId} = props
  return (
    <Button
      icon={ArrowLeftIcon}
      mode="bleed"
      onClick={onClick}
      text={text}
      textWeight="regular"
      padding={2}
      style={BACK_ALIGN_STYLE}
      data-testid={testId}
    />
  )
}
