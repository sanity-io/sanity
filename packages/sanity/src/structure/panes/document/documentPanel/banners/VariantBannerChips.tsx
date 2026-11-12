import {type BadgeTone} from '@sanity/ui'
import {type ReactNode} from 'react'
import {VersionInlineBadge} from 'sanity'

import {VariantMark} from '../../../../../ui-components/variantMark'

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
  // A no-break space ties the lead to the start of the chip; the chip can still wrap, so a long name never overflows the text column.
  return (
    <>
      {lead}&nbsp;{children}
    </>
  )
}

/** The variant, as a chip with its diamond: the only purple in a variant banner. */
export function VariantBadge({children, variantLead}: VariantBannerChipProps) {
  return (
    <Lead lead={variantLead}>
      <VersionInlineBadge $tone="suggest" data-testid="variant-banner-variant-chip">
        {/* 4px to the label, the glyph gap of the other chips in the banner sentence */}
        <VariantMark size="inline" style={{marginInlineEnd: '4px'}} />
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
