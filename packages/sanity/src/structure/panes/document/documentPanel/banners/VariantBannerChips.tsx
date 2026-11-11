import {type BadgeTone} from '@sanity/ui'
import {type ReactNode} from 'react'
import {VersionInlineBadge} from 'sanity'

import {RhombusIcon} from '../header/DocumentPanelNavigation/RhombusIcons'
import {chipIcon, keep} from './VariantBannerChips.css'

/**
 * The props `<Translate>` forwards to every chip in a variant banner's sentence (it passes the
 * same `componentProps` to each component).
 */
export interface VariantBannerChipProps {
  children?: ReactNode
  /** The word before the variant's chip ("variant"). */
  variantLead?: string
  /** The word before the release's chip ("release"). */
  releaseLead?: string
  releaseTone?: BadgeTone
  draftsTone?: BadgeTone
}

function Lead({lead, children}: {lead?: string; children: ReactNode}) {
  if (!lead) return children
  return (
    <span className={keep}>
      {lead} {children}
    </span>
  )
}

/** The variant, as a chip with its diamond: the only purple in a variant banner. */
export function VariantBadge({children, variantLead}: VariantBannerChipProps) {
  return (
    <Lead lead={variantLead}>
      <VersionInlineBadge $tone="suggest" data-testid="variant-banner-variant-chip">
        <RhombusIcon size="large" className={chipIcon} aria-hidden />
        {children}
      </VersionInlineBadge>
    </Lead>
  )
}

/** The release in view, as a chip in its tone. */
export function ReleaseBadge({children, releaseLead, releaseTone}: VariantBannerChipProps) {
  return (
    <Lead lead={releaseLead}>
      <VersionInlineBadge $tone={releaseTone}>{children}</VersionInlineBadge>
    </Lead>
  )
}

/** Drafts, where the Published banners point: a display chip, not a control. */
export function DraftsBadge({children, draftsTone}: VariantBannerChipProps) {
  return <VersionInlineBadge $tone={draftsTone}>{children}</VersionInlineBadge>
}
