import {useId} from 'react'
import {Text} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {type VersionPresence as VersionPresenceList} from '../utils/groupPresenceByVersion'
import {type PendingDraft} from '../utils/withPendingDraft'
import {LeadingGlyph} from './VariantSet/LeadingGlyph'
import {VariantSetEntry} from './VariantSet/VariantSetEntry'
import {VersionPresence} from './VariantSet/VersionPresence'

const NO_PRESENCE: VersionPresenceList = []

/**
 * The ghost row of a draft the form is about to create. In Drafts, when the open audience has no
 * draft yet, the form shows its published version and the first edit creates the draft. This row
 * stands where that draft will land, marked open, but drawn as not there yet: a dashed outline on
 * a light tint, an outline diamond for a variant, and "Not created yet". It has no checkbox and no
 * menu, since there is nothing to select, delete or compare. Its tooltip says how to create it.
 *
 * @internal
 */
export function PendingDraftEntry({draft, selectable}: {draft: PendingDraft; selectable: boolean}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const tooltip = t('document-group.version.pending-draft.tooltip')
  const descriptionId = useId()

  return (
    <Tooltip content={tooltip} placement="bottom-end">
      <VariantSetEntry
        data-testid="pending-draft-row"
        data-variant-name={draft.name}
        data-current
        data-pending
      >
        {/* An empty checkbox cell keeps the row on the same columns as the rows around it */}
        {selectable && <div className="atom" />}
        <VersionPresence presence={NO_PRESENCE} />
        <LeadingGlyph
          className="variant-mark"
          data-testid={draft.variantId ? 'variant-mark' : undefined}
          mark={draft.variantId ? 'variant-empty' : undefined}
        />
        <div className="row-content">
          {/*
           * The row's tab stop, so keyboard users reach the tooltip too. The draft is already the
           * open one, so it does nothing when pressed.
           */}
          <button
            type="button"
            className="primary-action"
            aria-current="true"
            aria-describedby={descriptionId}
          >
            {draft.name}
          </button>
          {/* The tooltip opens on hover and focus; its text is also the row's description */}
          <span id={descriptionId} hidden>
            {`${t('document-group.version.pending-draft')}. ${tooltip}`}
          </span>
          <div className="version-body">
            <div className="version-lines" data-testid="version-lines">
              <div className="version-title">
                <Text size={1} weight="medium" trim={true} data-testid="version-title">
                  {draft.name}
                </Text>
              </div>
              <div className="version-secondary">
                <Text muted size={1} as="div" trim={true} data-testid="version-secondary-line">
                  {t('document-group.version.pending-draft')}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </VariantSetEntry>
    </Tooltip>
  )
}
