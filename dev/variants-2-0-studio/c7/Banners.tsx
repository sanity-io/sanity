import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import {useState} from 'react'
import {type SanityClient, useClient, usePerspective} from 'sanity'

import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {useVersionList} from '../data/useVersionList'
import {type AudienceVersion} from '../data/versions'
import {useResultToast} from '../toasts/ResultToast'

/**
 * C7 V1 (banners), live data, from the Figma cover: the banner (or its absence) on a document that has no version
 * for the variant the studio shows (the variant chosen in the C1 row), in Drafts, Published and a release.
 *  - Option A (Figma C7 225:437): an explicit banner with "Create variant", always (in Drafts and releases); in
 *    Published a reason line, since variants are created in Drafts or in a release.
 *  - Option B (225:441): always live in Drafts, with a header hint "<variant> · not created yet. Your first edit
 *    creates it."; a banner only for Published and releases.
 * "Create variant" is a real `sanity.action.document.variant.create`, run only when clicked. With no variant chosen
 * there is nothing to say: no banner. Not built: the "no longer exists" banner ("Back to All users").
 */

type Chosen = {id: string; title: string}

function useShownVariant(): Chosen | null {
  const {chosen} = usePerspectiveState()
  const variants = useVariantDefinitions()
  const entries = Object.entries(chosen)
  if (!entries.length) return null
  const match = variants.find((v) => {
    const own = Object.entries(v.conditions)
    return own.length === entries.length && own.every(([name, key]) => chosen[name] === key)
  })
  if (!match) return null
  return {id: match._id.replace(/^_\.variants\./, ''), title: match.metadata?.title ?? match._id}
}

/** Does the document already have a version for this variant in the version the studio shows? */
function hasVariantHere(versions: readonly AudienceVersion[], title: string, version: string) {
  return versions.some((v) => {
    if (v.audience !== title) return false
    if (version === 'drafts') return v.state === 'draft' || v.state === 'published'
    if (version === 'published') return v.state === 'published'
    return v.bundleId === version
  })
}

/** Creates the variant version from the document's base; returns the failure message, or `null` when it worked. (Module scope, so the try/catch stays plain.) */
async function createVariantVersion(
  client: SanityClient,
  target: {documentId: string; variantId: string; bundleId: string},
): Promise<string | null> {
  try {
    const base = (await client.fetch('coalesce(*[_id == $id][0], *[_id == "drafts." + $id][0])', {
      id: target.documentId,
    })) as Record<string, unknown> | null
    if (!base) return 'The document has no base version to copy.'
    const {_id, _rev, _createdAt, _updatedAt, _system, ...content} = base
    void [_id, _rev, _createdAt, _updatedAt, _system]
    await client.action({
      actionType: 'sanity.action.document.variant.create',
      publishedId: target.documentId,
      variantId: target.variantId,
      bundleId: target.bundleId,
      document: content,
    } as never)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

export function DocumentBannerV1({
  documentId,
  option,
}: {
  documentId: string
  documentType: string
  option: 'a' | 'b'
}) {
  const versions = useVersionList(documentId)
  const shown = useShownVariant()
  const {selectedPerspectiveName} = usePerspective()
  const studioClient = useClient({apiVersion: 'X'})
  const showToast = useResultToast()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!versions || !shown) return null

  const version = selectedPerspectiveName ?? 'drafts'
  if (hasVariantHere(versions, shown.title, version)) return null

  const create = async () => {
    setCreating(true)
    setError(null)
    const failure = await createVariantVersion(
      studioClient.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}),
      {documentId, variantId: shown.id, bundleId: version},
    )
    setCreating(false)
    if (failure) {
      setError(failure)
      showToast(
        'failed',
        {variant: shown.title, verb: 'create', detail: failure},
        () => void create(),
      )
      return
    }
    // The version list refreshes on window focus.
    window.dispatchEvent(new Event('focus'))
    showToast('version-created', {variant: shown.title, document: 'This document'})
  }

  // Option B, in Drafts: no banner, a header hint.
  if (option === 'b' && version === 'drafts') {
    return (
      <Card
        data-testid="doc-banner-b-hint"
        paddingX={3}
        radius={3}
        paddingY={1}
        style={{borderBottom: '1px solid var(--card-border-color)'}}
        tone="transparent"
      >
        <Text muted size={0}>
          {shown.title} · not created yet. Your first edit creates it.
        </Text>
      </Card>
    )
  }

  // Published: variants are created in Drafts or in a release, so there is no action.
  if (version === 'published') {
    return (
      <Card
        data-testid={`doc-banner-${option}`}
        padding={3}
        radius={3}
        style={{borderBottom: '1px solid var(--card-border-color)'}}
        tone="caution"
      >
        <Text size={1}>This document has no {shown.title} variant.</Text>
        <Box paddingTop={1}>
          <Text muted size={1}>
            Variants are created in Drafts or in a release. Switch the version to create one.
          </Text>
        </Box>
      </Card>
    )
  }

  return (
    <Card
      data-testid={`doc-banner-${option}`}
      padding={3}
      radius={3}
      style={{borderBottom: '1px solid var(--card-border-color)'}}
      tone="caution"
    >
      <Flex align="center" gap={3}>
        <Box flex={1}>
          <Text size={1}>This document has no {shown.title} variant.</Text>
          {error && (
            <Box paddingTop={1}>
              <Text size={1}>Could not create it: {error}</Text>
            </Box>
          )}
        </Box>
        <Button
          disabled={creating}
          fontSize={1}
          onClick={create}
          text={creating ? 'Creating…' : 'Create variant'}
          tone="primary"
        />
      </Flex>
    </Card>
  )
}
