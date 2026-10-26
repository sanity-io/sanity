import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  isReleaseDocument,
  ReleaseAvatarIcon,
  type ReleaseDocument,
  RELEASES_INTENT,
  useCurrentLocale,
  usePerspective,
  useSetVariant,
  useWorkspace,
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

/** "Drafts", where the Published banner points: a display chip, not a control. */
function DraftsChip() {
  return (
    <VersionInlineBadge $tone="caution" icon={<ReleaseAvatarIcon release="drafts" />}>
      Drafts
    </VersionInlineBadge>
  )
}

/**
 * A date in the sentence: its own neutral chip (it is set elsewhere), in the Studio's locale; with the time where the schedule has one
 * (Faheem, 23 Oct). The release chip is then the release's name only.
 */
function DateChip({iso, withTime}: {iso: string; withTime?: boolean}) {
  const locale = useCurrentLocale().id
  const text = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    ...(withTime ? {hour: 'numeric', minute: '2-digit'} : {}),
  }).format(new Date(iso))
  return <VersionInlineBadge $tone="default">{text}</VersionInlineBadge>
}

/**
 * Faheem, 23 Oct: the release's kind is a word in the sentence, the chip is its identity. "the ASAP release", "the undecided release", and
 * an at-time release not yet scheduled is "the release" (it is not called scheduled until it is).
 */
function releaseKindPrefix(release: ReleaseDocument | undefined) {
  const type = release?.metadata.releaseType
  return type === 'asap' ? 'ASAP ' : type === 'undecided' ? 'undecided ' : ''
}

/** A type word and its chip (or "on" / "for" and a date), kept on one line: a line never breaks between them (Faheem, 23 Oct). */
function Keep({children}: {children?: ReactNode}) {
  return <span style={{whiteSpace: 'nowrap'}}>{children}</span>
}

/** A release by its name, glyph and tone (its date, if any, is its own chip in the sentence). */
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
  // Drafts exist unless the document type is live edit or the workspace has the draft model off (the pills' rule for the Draft pill).
  const hasDrafts = useWorkspace().document.drafts.enabled && !pane.schemaType?.liveEdit
  const {create, status} = useCreateVariantVersion(documentId)
  const banner = useBannerCase(documentId)
  const inventoryOpen = pane.inspector?.name === INVENTORY
  const {selectedPerspective} = usePerspective()
  const {navigateIntent, stickyParams} = useRouter()
  const release = isReleaseDocument(selectedPerspective) ? selectedPerspective : undefined
  // A locked release publishes on its schedule (date and time); an at-time release not yet scheduled is planned for its date.
  const lockedAt = release?.publishAt ?? release?.metadata.intendedPublishAt
  const plannedAt =
    release?.metadata.releaseType === 'scheduled' ? release.metadata.intendedPublishAt : undefined

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
                The{' '}
                <Keep>
                  variant <VariantChip title={banner.goneTitle} />
                </Keep>{' '}
                no longer exists.
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
    // Ported from the Design Studio's C7 option A (Figma C7 225:437), with the create button. Neutral like every banner but the deleted one (Faheem, 23 Oct).
    return (
      <Banner
        action={createAction}
        content={say(
          <>
            This document has no draft for the{' '}
            <Keep>
              variant <VariantChip title={audience} />
            </Keep>{' '}
            yet. Create one to start editing.
          </>,
          'drafts',
        )}
        icon={InfoOutlineIcon}
        tone="neutral"
      />
    )
  }

  if (banner.kind === 'published') {
    // Faheem, 23 Oct: one click to where a version can be made. Switch to Drafts keeps the variant in view (the pills' rule: a version choice
    // keeps the variant); "an open release" stays text, since there can be several.
    const variant = typeof stickyParams.variant === 'string' ? stickyParams.variant : undefined
    // A live-edit document (or a workspace without drafts) has no Drafts to switch to: the banner names only an open release, with no button
    // (the pills show no Draft pill there either).
    if (!hasDrafts) {
      return (
        <Banner
          content={say(
            <>
              This document has no published version for the{' '}
              <Keep>
                variant <VariantChip title={audience} />.
              </Keep>{' '}
              Switch to an open release to create one.
            </>,
            'published',
          )}
          icon={InfoOutlineIcon}
          tone="neutral"
        />
      )
    }
    // 26 Oct call (Pedro): with no draft to switch to, Switch to Drafts then Create version was two steps. The banner is the create one: it makes
    // the version in Drafts and takes the viewer there.
    if (banner.createsDraft) {
      return (
        <Banner
          action={{
            disabled: busy,
            mode: 'default',
            onClick: () =>
              void create({variantId: banner.variantId, perspective: 'drafts' as never}).then(
                (created) => {
                  if (created)
                    setVariant({variantId: variant as never, perspective: 'drafts' as never})
                },
              ),
            text: busy ? 'Creating…' : 'Create version',
            tone: 'primary',
          }}
          content={say(
            <>
              This document has no published version for the{' '}
              <Keep>
                variant <VariantChip title={audience} />.
              </Keep>{' '}
              Create a version{' '}
              <Keep>
                in <DraftsChip />
              </Keep>{' '}
              to start editing.
            </>,
            'published',
          )}
          icon={InfoOutlineIcon}
          tone="neutral"
        />
      )
    }
    return (
      <Banner
        action={{
          mode: 'ghost',
          onClick: () => setVariant({variantId: variant as never, perspective: 'drafts' as never}),
          text: 'Switch to Drafts',
        }}
        content={say(
          <>
            This document has no published version for the{' '}
            <Keep>
              variant <VariantChip title={audience} />.
            </Keep>{' '}
            Switch{' '}
            <Keep>
              to <DraftsChip />
            </Keep>{' '}
            or an open release to create one.
          </>,
          'published',
        )}
        icon={InfoOutlineIcon}
        tone="neutral"
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
            The scheduled{' '}
            <Keep>
              release <ReleaseChip release={release} title={releaseTitle} />
            </Keep>
            {lockedAt ? (
              <>
                {' '}
                publishes{' '}
                <Keep>
                  on <DateChip iso={lockedAt} withTime />
                </Keep>
              </>
            ) : null}{' '}
            and is locked. Unschedule it to add a version for the{' '}
            <Keep>
              variant <VariantChip title={audience} />.
            </Keep>
          </>,
          'scheduled',
        )}
        icon={InfoOutlineIcon}
        // Neutral for every release (Faheem, 23 Oct): the chips carry the colour, as core's banner for the base document.
        tone="neutral"
      />
    )
  }

  return (
    <Banner
      action={createAction}
      content={say(
        <>
          This document has no version for the{' '}
          <Keep>
            variant <VariantChip title={audience} />
          </Keep>{' '}
          in the {releaseKindPrefix(release)}
          <Keep>
            release <ReleaseChip release={release} title={releaseTitle} />
            {plannedAt ? ',' : '.'}
          </Keep>
          {plannedAt ? (
            <>
              {' '}
              planned{' '}
              <Keep>
                for <DateChip iso={plannedAt} />.
              </Keep>
            </>
          ) : null}{' '}
          It shows the base content until you create one.
        </>,
        'release',
      )}
      icon={InfoOutlineIcon}
      // Neutral (Faheem, 23 Oct): one grey banner for every slot and release; the chips and the button carry the colour. Only the deleted
      // variant's banner keeps a tone (caution), as the one with a real risk.
      tone="neutral"
    />
  )
}
