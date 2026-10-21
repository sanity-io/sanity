import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Text} from '@sanity/ui'
import {isReleaseDocument, usePerspective, useSetVariant} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {isReleaseScheduledOrScheduling} from '../../../packages/sanity/src/core/releases/util/util'
import {Banner} from '../../../packages/sanity/src/structure/panes/document/documentPanel/banners/Banner'
import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {requestCreateVersion} from '../c4/inventory/CreateVersion'
import {useMadeEntries} from '../c4/inventory/LiveInventory'
import {useVersionList} from '../data/useVersionList'
import {type AudienceVersion} from '../data/versions'

/**
 * T6, the open beta banner (docs/initiatives/curation-perspective-selector/BANNERS-DECISION-2026-10-22.md, with its revision): an audience is
 * chosen and the open document has no version for it in the version the studio shows. Drawn with the Studio's own document banner; the stock
 * variant banners are replaced (VariantBannerReplacedProvider), so there is one.
 * - Drafts: a quiet notice, no button. Core keeps the form editable and the first edit creates the version.
 * - An open release: "Create version" opens the inventory in Create version mode, prefilled (this audience, this release, Nearest version). It
 *   never creates on its own.
 * - A scheduled release, Published: the text says why there is no action.
 * - The chosen variant no longer exists: "Back to All users".
 * - With the inventory open there is no button: its own Create version is there.
 */

/** The inspector the inventory opens in (c4/InventoryInspector.tsx). */
const INVENTORY = 'variants-inventory'

const shortId = (id: string) => id.replace(/^_\.variants\./, '')
const humanize = (key: string) => key.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

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
  const made = useMadeEntries(documentId)
  const setVariant = useSetVariant()
  const pane = useDocumentPane()
  const inventoryOpen = pane.inspector?.name === INVENTORY
  const documentTitle = String(pane.value?.title ?? pane.title ?? 'This document')

  // The chosen variant no longer exists: the router names one that no definition carries (once the definitions have loaded). Its title went with
  // it, so it is named by the value that was chosen ("Students"), never by its id.
  const gone = humanize(
    Object.values(chosen)[0] ?? shortId(selectedVariantName ?? '').replace(/^[a-z]+-/, ''),
  )
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
            The <strong>{gone}</strong> variant no longer exists.
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
  const madeHere = made.some((e) => e.variantId === variantId && e.group === version)
  if (madeHere || hasVariantHere(versions, variantId, version)) return null

  const strong = (text: string) => <strong>{text}</strong>
  const say = (body: React.ReactNode, state: string) => (
    <Text data-case={state} data-testid="open-beta-banner" size={1}>
      {body}
    </Text>
  )

  if (version === 'drafts') {
    // Quiet: core keeps the form editable; the first edit creates the version from the base content.
    return (
      <Banner
        content={say(
          <>
            {documentTitle} has no {strong(audience)} version yet. Your first edit creates one from
            the base content.
          </>,
          'drafts',
        )}
        tone="transparent"
      />
    )
  }

  if (version === 'published') {
    return (
      <Banner
        content={say(
          <>
            {documentTitle} has no published {strong(audience)} version. Published takes no new
            version: switch to Drafts or an open release to create one.
          </>,
          'published',
        )}
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
            {documentTitle} has no {strong(audience)} version in {strong(releaseTitle)}. Scheduled
            releases are locked.
          </>,
          'scheduled',
        )}
        tone="suggest"
      />
    )
  }

  return (
    <Banner
      action={
        inventoryOpen
          ? undefined
          : {
              text: 'Create version',
              tone: 'suggest',
              mode: 'default',
              onClick: () => {
                requestCreateVersion(documentId, {variantId, bundle: version})
                pane.openInspector(INVENTORY)
              },
            }
      }
      content={say(
        <>
          {documentTitle} has no {strong(audience)} version in {strong(releaseTitle)}. It shows the
          base content.
        </>,
        'release',
      )}
      tone="suggest"
    />
  )
}
