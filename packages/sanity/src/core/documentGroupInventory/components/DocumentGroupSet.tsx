import {type ReactNode} from 'react'
import {Text} from 'ui5'

import {VariantSet} from './VariantSet/VariantSet'
import {VariantSetHeader} from './VariantSet/VariantSetHeader'

/**
 * A named card of document-group versions. Shared by the inventory and picker
 * so set chrome (card, header, set name) cannot drift.
 *
 * @internal
 */
export function DocumentGroupSet({
  name,
  headerActions,
  children,
}: {
  name: string
  headerActions?: ReactNode
  children: ReactNode
}) {
  return (
    <VariantSet data-variant-set={name}>
      <VariantSetHeader as="header">
        <Text size={1} weight="medium" as="div" trim={true}>
          {name}
        </Text>
        {headerActions}
      </VariantSetHeader>
      {children}
    </VariantSet>
  )
}
