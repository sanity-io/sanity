import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Text} from '@sanity/ui'
import {useEffect} from 'react'
import {isReleaseDocument, usePerspective, useSetVariant} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {isReleaseScheduledOrScheduling} from '../../../packages/sanity/src/core/releases/util/util'
import {Banner} from '../../../packages/sanity/src/structure/panes/document/documentPanel/banners/Banner'
import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {useCreateVariantVersion} from '../data/useCreateVariantVersion'
import {useVersionList} from '../data/useVersionList'
import {type AudienceVersion} from '../data/versions'

/**
 * T6, the open beta banner (docs/initiatives/curation-perspective-selector/BANNERS-DECISION-2026-10-22.md, with its revision; Figma C7
 * 678:768, B1 to B6: the info icon and plain text; tones per state, since the library banner has no tone property): an audience is
 * chosen and the open document has no version for it in the version the studio shows. Drawn with the Studio's own document banner; the stock
 * variant banners are replaced (VariantBannerReplacedProvider), so there is one.
 * - Drafts and an open release: "Create version" creates the version, from the base, in the version the studio shows, and stays there (Faheem,
 *   22 Oct: "Create version should actually just create a version, keeping the current perspective"). It is core's create, as core's own
 *   banner sends it (data/useCreateVariantVersion). Drafts is caution, as the Design Studio's C7 option A: the document cannot be edited in
 *   place without the version.
 * - A scheduled release, Published: the text says why there is no action.
 * - The chosen variant no longer exists: caution with the warning icon, as core's not-found banner, and "Back to All users".
 * - With the inventory open there is no button: its own Create version is there.
 */

/** The inspector the inventory opens in (c4/InventoryInspector.tsx). */
const INVENTORY = 'variants-inventory'

const shortId = (id: string) => id.replace(/^_\.variants\./, '')
/** The titles of the variant definitions seen this session, so a variant deleted later is still named by its title (never by its id). */
const seenTitles = new Map<string, string>()

/** Does the document already have a version for this variant in the version the studio shows? (Ported from the Design Studio's C7.) */
function hasVariantHere(versions: readonly AudienceVersion[], variantId: string, version: string) {
  return versions.some((v) => {
    if (v.variantId !== variantId) return false
    if (version === 'drafts') return v.state === 'draft' || v.state === 'published'
    if (version === 'published') return v.state === 'published'
    return v.bundleId === version
  })
}

export function OpenBetaBanner({documentId}: {documentId: string}) {
  const {selectedPerspective, selectedPerspectiveName, selectedVariantName} = usePerspective()
  const {chosen, setChosen} = usePerspectiveState()
  const definitions = useVariantDefinitions()
  const versions = useVersionList(documentId)
  const setVariant = useSetVariant()
  const pane = useDocumentPane()
  const {create, status} = useCreateVariantVersion(documentId)
  const inventoryOpen = pane.inspector?.name === INVENTORY
  // A document's own name: its title, or its name (an author has no title field).
  const own = [pane.value?.title, pane.value?.name].find((t) => typeof t === 'string' && t)
  const documentTitle = typeof own === 'string' ? own : 'This document'

  useEffect(() => {
    for (const d of definitions)
      if (d.metadata?.title) seenTitles.set(shortId(d._id), d.metadata.title)
  }, [definitions])

  // The chosen variant no longer exists: the router names one that no definition carries (once the definitions have loaded). It is named by
  // the title seen this session; without one the banner says "the chosen variant".
  const goneTitle = selectedVariantName ? seenTitles.get(shortId(selectedVariantName)) : undefined
  if (
    selectedVariantName &&
    definitions.length &&
    !definitions.some((d) => shortId(d._id) === shortId(selectedVariantName))
  ) {
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
            {goneTitle ? (
              <>The {goneTitle} variant no longer exists.</>
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

  const entries = Object.entries(chosen)
  if (!entries.length || !versions) return null
  const definition = definitions.find((d) => {
    const own = Object.entries(d.conditions)
    return own.length === entries.length && own.every(([name, key]) => chosen[name] === key)
  })
  if (!definition) return null
  const variantId = shortId(definition._id)
  const audience = definition.metadata?.title ?? variantId
  const version = selectedPerspectiveName ?? 'drafts'
  if (hasVariantHere(versions, variantId, version)) return null

  // The button of the Drafts and open-release cases. It stays disabled from the click until the version is listed and the banner goes away.
  const busy = status === 'creating' || status === 'created'
  const createAction = inventoryOpen
    ? undefined
    : {
        disabled: busy,
        mode: 'default' as const,
        onClick: () => void create(),
        text: busy ? 'Creating…' : 'Create version',
        tone: version === 'drafts' ? ('primary' as const) : ('suggest' as const),
      }

  const say = (body: React.ReactNode, state: string) => (
    <Text data-case={state} data-testid="open-beta-banner" size={1}>
      {body}
    </Text>
  )

  if (version === 'drafts') {
    // Ported from the Design Studio's C7 option A (Figma C7 225:437): caution, with the create button.
    return (
      <Banner
        action={createAction}
        content={say(
          <>
            {documentTitle} has no {audience} version yet. Create it to start editing.
          </>,
          'drafts',
        )}
        icon={InfoOutlineIcon}
        tone="caution"
      />
    )
  }

  if (version === 'published') {
    return (
      <Banner
        content={say(
          <>
            {documentTitle} has no published {audience} version. Published takes no new version:
            switch to Drafts or an open release to create one.
          </>,
          'published',
        )}
        icon={InfoOutlineIcon}
        tone="suggest"
      />
    )
  }

  const release = isReleaseDocument(selectedPerspective) ? selectedPerspective : undefined
  const releaseTitle = release?.metadata?.title || version
  if (release && isReleaseScheduledOrScheduling(release)) {
    return (
      <Banner
        content={say(
          <>
            {documentTitle} has no {audience} version in {releaseTitle}. Scheduled releases are
            locked.
          </>,
          'scheduled',
        )}
        icon={InfoOutlineIcon}
        tone="suggest"
      />
    )
  }

  return (
    <Banner
      action={createAction}
      content={say(
        <>
          {documentTitle} has no {audience} version in {releaseTitle}. It shows the base content.
        </>,
        'release',
      )}
      icon={InfoOutlineIcon}
      tone="suggest"
    />
  )
}
