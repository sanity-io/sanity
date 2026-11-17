import {type ComponentType, type ReactNode} from 'react'
import {Text} from 'ui5'

import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {type VariantSetBundle} from '../machines/documentGroupInventoryMachine'
import {VariantCheckbox} from './VariantSet/VariantCheckbox'
import {VariantSet} from './VariantSet/VariantSet'
import {VariantSetHeader} from './VariantSet/VariantSetHeader'

/**
 * A named card of document-group versions. Shared by the inventory and picker
 * so set chrome (card, header, set name) cannot drift.
 *
 * @internal
 */
export const DocumentGroupSet: ComponentType<{
  name: string
  headerActions?: ReactNode
  children: ReactNode
  bundle?: VariantSetBundle
  selectedIds: ReadonlySet<string>
  /** Whether every version in the set is selected. */
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** Whether the set's versions can never be selected, as in the picker. Omits the checkbox. */
  readOnly?: boolean
  /** Whether the selection is frozen, as it is while a deletion is in flight. */
  locked?: boolean
}> = ({
  name,
  headerActions,
  children,
  bundle,
  selectedIds,
  checked,
  onCheckedChange,
  readOnly,
  locked,
}) => (
  <VariantSet data-variant-set={name}>
    <VariantSetHeader as="header">
      <div className="variant-set-leading">
        {!readOnly && (
          <VariantCheckbox
            data-visible={selectedIds.size !== 0}
            checked={checked}
            readOnly={locked}
            onChange={(event) => onCheckedChange(event.currentTarget.checked)}
          />
        )}
        <div className="variant-set-icon">
          {bundle?.type === 'agent' && (
            // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
            <ReleaseAvatarIcon tone="suggest" />
          )}
          {bundle?.type === 'perspective' && <ReleaseAvatarIcon release={bundle.perspective} />}
        </div>
      </div>
      <div>
        <Text size={1} weight="medium" as="div" trim={true}>
          {name}
        </Text>
        {headerActions}
      </div>
    </VariantSetHeader>
    {children}
  </VariantSet>
)
