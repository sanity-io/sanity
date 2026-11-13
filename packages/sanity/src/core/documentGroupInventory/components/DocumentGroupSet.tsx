import {type BadgeTone} from '@sanity/ui'
import {type ComponentType, type ReactNode} from 'react'
import {Flex, Text} from 'ui5'

import {type StatusMarkName} from '../../../ui-components/statusMark/statusMarkGeometry'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {isReleaseDocument} from '../../releases/store/types'
import {getReleaseTone} from '../../releases/util/getReleaseTone'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'
import {isAgentBundleName} from '../../store/agent/createAgentBundlesStore'
import {isPausedCardinalityOneRelease} from '../../util/releaseUtils'
import {type VariantSetBundle} from '../machines/documentGroupInventoryMachine'
import {type GroupSelectionState} from '../utils/selection'
import {LeadingGlyph} from './VariantSet/LeadingGlyph'
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
  /** How many versions the set holds. Omitted when the name already says it. */
  count?: number
  headerActions?: ReactNode
  children: ReactNode
  bundle?: VariantSetBundle
  /** The group checkbox's state, from the selectable versions in the set. */
  selectionState: GroupSelectionState
  /** Called with `true` to select every selectable version in the set, `false` to deselect them. */
  onCheckedChange: (checked: boolean) => void
  /** Why no version in the set can be selected. Shown on the group checkbox. */
  blockedReason?: string
  /** Whether the set's versions can never be selected, as in the picker. Omits the checkbox. */
  readOnly?: boolean
  /** Whether the selection is frozen, as it is while a deletion is in flight. */
  locked?: boolean
}> = ({
  name,
  count,
  headerActions,
  children,
  bundle,
  selectionState,
  onCheckedChange,
  blockedReason,
  readOnly,
  locked,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)

  return (
    <VariantSet data-variant-set={name} data-selectable={!readOnly}>
      <VariantSetHeader as="header">
        {!readOnly && (
          <div className="atom">
            <VariantCheckbox
              label={t('document-group.select-group', {name})}
              checked={selectionState === 'checked'}
              indeterminate={selectionState === 'indeterminate'}
              locked={locked}
              blockedReason={blockedReason}
              onChange={(checked) => onCheckedChange(checked)}
            />
          </div>
        )}
        <LeadingGlyph
          className="variant-set-icon"
          data-testid="variant-set-icon"
          {...(bundle ? bundleMark(bundle) : {})}
        />
        <div className="variant-set-text">
          <Flex gap={2} alignItems="center">
            <Text size={1} weight="medium" as="div" trim={true} data-testid="variant-set-name">
              {name}
            </Text>
            {typeof count === 'number' && (
              <Text size={1} muted as="div" trim={true} data-testid="variant-set-count">
                {count}
              </Text>
            )}
          </Flex>
          {headerActions}
        </div>
      </VariantSetHeader>
      {children}
    </VariantSet>
  )
}

/**
 * A set's status mark: Published is a disc, Draft a ring, a release its type's pictogram (a
 * paused release the clock), an agent bundle the sparkle. A release keeps the tone it has
 * elsewhere, so an archived or paused one does not take its type's tone.
 */
function bundleMark(bundle: VariantSetBundle): {mark: StatusMarkName; tone?: BadgeTone} {
  if (bundle.type === 'agent') return {mark: 'agent'}
  const {perspective} = bundle
  if (isReleaseDocument(perspective)) {
    return {
      mark: isPausedCardinalityOneRelease(perspective)
        ? 'scheduled'
        : perspective.metadata.releaseType,
      tone: getReleaseTone(perspective),
    }
  }
  if (isPublishedPerspective(perspective)) return {mark: 'published'}
  if (isDraftPerspective(perspective)) return {mark: 'draft'}
  if (isAgentBundleName(perspective)) return {mark: 'agent'}
  return {mark: 'undecided', tone: getReleaseTone(perspective)}
}
