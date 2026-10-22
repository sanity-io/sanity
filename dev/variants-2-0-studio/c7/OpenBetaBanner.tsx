import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Text} from '@sanity/ui'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  isReleaseDocument,
  ReleaseAvatarIcon,
  type ReleaseDocument,
  RELEASES_INTENT,
  usePerspective,
  useSetVariant,
  VersionInlineBadge,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {useDocumentPane} from 'sanity/structure'

import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {Banner} from '../../../packages/sanity/src/structure/panes/document/documentPanel/banners/Banner'
import {usePerspectiveState} from '../c1/state'
import {useCreateVariantVersion} from '../data/useCreateVariantVersion'
import {useBannerCase} from './useBannerCase'

/**
 * T6, the open beta banner (docs/initiatives/curation-perspective-selector/BANNERS-DECISION-2026-10-22.md, with its revision; Figma C7
 * 678:768, B1 to B6: the info icon and plain text; tones per state, since the library banner has no tone property): an audience is
 * chosen and the open document has no version for it in the version the studio shows. Drawn with the Studio's own document banner; the stock
 * variant banners are replaced (VariantBannerReplacedProvider), so there is one.
 * - Drafts and an open release: "Create version" creates the version, from the base, in the version the studio shows, and stays there (Faheem,
 *   22 Oct: "Create version should actually just create a version, keeping the current perspective"). It is core's create, as core's own
 *   banner sends it (data/useCreateVariantVersion). Drafts is caution, as the Design Studio's C7 option A: the document cannot be edited in
 *   place without the version.
 * - Published: the text says why there is no action.
 * - A scheduled release: the text says its contents are locked and how to add the version (unschedule it), with "Open release", which opens it
 *   in the Releases tool where Unschedule is; as core's own banner says for the base document. Nothing can be added from here.
 * - The chosen variant no longer exists: caution with the warning icon, as core's not-found banner, and "Back to All users".
 * - Create version shows with the inventory open too (it is one click), and the inventory's toolbar Create version then steps aside (22 Oct
 *   call: one on screen). Back to All users is left out while the inventory is open. The decision is c7/useBannerCase.ts.
 */

/** The inspector the inventory opens in (c4/InventoryInspector.tsx). */
const INVENTORY = 'variants-inventory'

/**
 * Faheem, 23 Oct: a banner never names the document ("This document"; its title is right under the banner), and names the variant and the
 * version or release as inline display chips, core's chip for release names (not controls), with their glyph and tone.
 */
function VariantChip({title}: {title: string}) {
  return (
    <VersionInlineBadge $tone="suggest" icon={<RhombusIcon />}>
      {title}
    </VersionInlineBadge>
  )
}

function PublishedChip() {
  return (
    <VersionInlineBadge $tone="positive" icon={<ReleaseAvatarIcon release="published" />}>
      Published
    </VersionInlineBadge>
  )
}

function ReleaseChip({release, title}: {release: ReleaseDocument | undefined; title: string}) {
  return (
    <VersionInlineBadge
      $tone={getReleaseTone(release ?? 'drafts')}
      icon={release ? <ReleaseAvatarIcon release={release} /> : undefined}
    >
      {title}
    </VersionInlineBadge>
  )
}

export function OpenBetaBanner({documentId}: {documentId: string}) {
  const {setChosen} = usePerspectiveState()
  const setVariant = useSetVariant()
  const pane = useDocumentPane()
  const {create, status} = useCreateVariantVersion(documentId)
  const banner = useBannerCase(documentId)
  const inventoryOpen = pane.inspector?.name === INVENTORY
  const {selectedPerspective} = usePerspective()
  const {navigateIntent} = useRouter()
  const release = isReleaseDocument(selectedPerspective) ? selectedPerspective : undefined

  // No banner of ours, or core's own not-in-release banner (with Add to release) for the base document.
  if (!banner || banner.kind === 'base-release') return null

  // The chosen variant no longer exists: named by the title seen this session; without one the banner says "the chosen variant".
  if (banner.kind === 'deleted') {
    return (
      <Banner
        action={
          inventoryOpen
            ? undefined
            : {
                text: 'Back to All users',
                mode: 'default',
                onClick: () => {
                  setVariant({variantId: undefined as never})
                  setChosen({})
                },
              }
        }
        content={
          <Text data-testid="open-beta-banner" data-case="deleted" size={1}>
            {banner.goneTitle ? (
              <>
                The <VariantChip title={banner.goneTitle} /> variant no longer exists.
              </>
            ) : (
              'The chosen variant no longer exists.'
            )}
          </Text>
        }
        icon={WarningOutlineIcon}
        tone="caution"
      />
    )
  }

  const {audience, releaseTitle} = banner
  // The button of the Drafts and open-release cases. It stays disabled from the click until the version is listed and the banner goes away.
  const busy = status === 'creating' || status === 'created'
  // Shown with the inventory open too, and then the inventory's toolbar Create version steps aside (bannerOffersCreate): one on screen.
  const createAction = {
    disabled: busy,
    mode: 'default' as const,
    onClick: () => void create(),
    text: busy ? 'Creating…' : 'Create version',
    tone: banner.kind === 'drafts' ? ('primary' as const) : ('suggest' as const),
  }

  const say = (body: React.ReactNode, state: string) => (
    <Text data-case={state} data-testid="open-beta-banner" size={1}>
      {body}
    </Text>
  )

  if (banner.kind === 'drafts') {
    // Ported from the Design Studio's C7 option A (Figma C7 225:437): caution, with the create button.
    return (
      <Banner
        action={createAction}
        content={say(
          <>
            This document has no <VariantChip title={audience} /> version yet. Create it to start
            editing.
          </>,
          'drafts',
        )}
        icon={InfoOutlineIcon}
        tone="caution"
      />
    )
  }

  if (banner.kind === 'published') {
    return (
      <Banner
        content={say(
          <>
            This document has no <VariantChip title={audience} /> version in <PublishedChip />.
            Switch to Drafts or an open release to create one.
          </>,
          'published',
        )}
        icon={InfoOutlineIcon}
        tone="suggest"
      />
    )
  }

  if (banner.kind === 'scheduled') {
    return (
      <Banner
        action={
          release
            ? {
                mode: 'ghost',
                onClick: () =>
                  navigateIntent(RELEASES_INTENT, {
                    id: getReleaseIdFromReleaseDocumentId(release._id),
                  }),
                text: 'Open release',
              }
            : undefined
        }
        content={say(
          <>
            <ReleaseChip release={release} title={releaseTitle} /> is scheduled, so its contents are
            locked. Unschedule it to add this version.
          </>,
          'scheduled',
        )}
        icon={InfoOutlineIcon}
        // The release's own tone (neutral), as core's banner for the base document: purple is the variants' colour.
        tone={getReleaseTone(release ?? 'drafts')}
      />
    )
  }

  return (
    <Banner
      action={createAction}
      content={say(
        <>
          This document has no <VariantChip title={audience} /> version in{' '}
          <ReleaseChip release={release} title={releaseTitle} />. It shows the base content.
        </>,
        'release',
      )}
      icon={InfoOutlineIcon}
      tone="suggest"
    />
  )
}
