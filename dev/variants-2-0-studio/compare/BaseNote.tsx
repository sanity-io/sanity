import {Button, Flex, Text} from '@sanity/ui'

import {Pick} from '../pane/Pick'
import {type Address, sameAddress} from './address'
import {defaultBase, setReviewBase} from './reviewBase'

/**
 * "Comparing against: <address>", and, when the base is not the default, a way back to Published. Used wherever a base appears (review panel,
 * compare header, list header), so the wording and the way back are the same everywhere.
 */
export function BaseNote(props: {
  showing: Address
  base: Address
  label: (address: Address) => string
  /** What "back" does besides clearing the stored base (the compare header also moves its Against pane). */
  onReset?: (to: Address) => void
  /** Where the surface has no Against picker of its own (the list header), the addresses the user can pick as the base. */
  options?: Address[]
}) {
  const {showing, base, label, onReset, options} = props
  const fallback = defaultBase(showing)
  const isDefault = sameAddress(base, fallback)
  return (
    <Flex align="center" data-testid="base-note" gap={2} wrap="wrap">
      <Text data-testid="base-text" size={1}>
        Comparing against: {label(base)}
      </Text>
      {options ? (
        <Pick
          items={options.map((address) => ({
            key: `${address.perspective}|${address.variant}`,
            text: label(address),
            selected: sameAddress(address, base),
            onClick: () => {
              setReviewBase(address, showing)
              onReset?.(address)
            },
          }))}
          testId="base-pick"
          text="Change base"
        />
      ) : null}
      {isDefault ? null : (
        <Button
          data-testid="base-reset"
          fontSize={1}
          mode="bleed"
          onClick={() => {
            setReviewBase(null)
            onReset?.(fallback)
          }}
          padding={2}
          text={
            fallback.perspective === 'published'
              ? 'Back to Published'
              : `Back to ${label(fallback)}`
          }
        />
      )}
    </Flex>
  )
}
