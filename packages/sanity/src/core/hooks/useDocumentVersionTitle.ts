import {getReleasePerspective} from '../components/documentStatus/getReleasePerspective'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {useAgentBundles} from '../store/agent/useAgentBundles'
import {useWorkspace} from '../studio/workspace'
import {getVersionFilterLabel} from '../variants/plugin/components/getVersionFilterLabel'
import {useAllVariants} from '../variants/store/useAllVariants'
import {getVariantTitle} from '../variants/tool/util'

function getSystemRef(reference: {_ref?: string} | undefined): string | undefined {
  if (reference === undefined) {
    return undefined
  }

  return reference._ref
}

function isVariantsFeatureEnabled(workspace: ReturnType<typeof useWorkspace>): boolean {
  const beta = workspace.beta
  if (beta === undefined) {
    return false
  }

  const variants = beta.variants
  if (variants === undefined) {
    return false
  }

  return variants.enabled === true
}

function getDocumentVersionStatusTitle({
  variantsEnabled,
  variantTitle,
  releaseTitle,
}: {
  variantsEnabled: boolean
  variantTitle: string
  releaseTitle: string
}): string {
  if (!variantsEnabled) {
    return releaseTitle
  }

  return `${variantTitle} · ${releaseTitle}`
}

function getDocumentVersionStatusTitles({
  variantsEnabled,
  variantTitle,
  displayTitle,
  releaseFullTitle,
}: {
  variantsEnabled: boolean
  variantTitle: string
  displayTitle: string
  releaseFullTitle: string
}): {title: string; fullTitle: string} {
  let title = ''
  let fullTitle = ''

  for (const [target, releaseTitle] of [
    ['title', displayTitle],
    ['fullTitle', releaseFullTitle],
  ] as const) {
    const value = getDocumentVersionStatusTitle({variantsEnabled, variantTitle, releaseTitle})
    if (target === 'title') {
      title = value
    } else {
      fullTitle = value
    }
  }

  return {title, fullTitle}
}

function buildVersionTitleResult({
  variantsEnabled,
  variantTitle,
  displayTitle,
  releaseFullTitle,
  isTruncated,
}: {
  variantsEnabled: boolean
  variantTitle: string
  displayTitle: string
  releaseFullTitle: string
  isTruncated: boolean
}): {title: string; fullTitle: string; isTruncated: boolean} {
  const {title, fullTitle} = getDocumentVersionStatusTitles({
    variantsEnabled,
    variantTitle,
    displayTitle,
    releaseFullTitle,
  })

  return {title, fullTitle, isTruncated}
}

/**
 * Returns the version info title, full title, and whether the title is truncated for a given version.
 * It maps the version status to a release and a variant.
 * So for example:
 * - Published default: "All users (Default) · Published"
 * - Published variant: "Variant name · Published"
 * - Draft variant: "Variant name · Draft"
 * - Release default: "All users (Default) · Release name"
 * - Release variant: "Variant name · Release name"
 */
export function useDocumentVersionTitle({version}: {version: VersionInfoDocumentStub}) {
  const {byId: variantsById, loading: variantsLoading, error: variantsError} = useAllVariants()
  const {byId: releasesById, loading: releasesLoading, error: releasesError} = useActiveReleases()
  const {bundles} = useAgentBundles()
  const variantsEnabled = isVariantsFeatureEnabled(useWorkspace())

  const {t} = useTranslation()

  if (variantsLoading || releasesLoading) {
    const loadingCopy = t('common.loading')
    return {
      title: loadingCopy,
      isTruncated: false,
      fullTitle: loadingCopy,
    }
  }
  if (variantsError || releasesError) {
    const errorCopy = t('common.error')
    return {
      title: errorCopy,
      isTruncated: false,
      fullTitle: errorCopy,
    }
  }

  const variantRef = getSystemRef(version._system.variant)
  const releaseRef = getSystemRef(version._system.release)
  const variant = variantRef ? variantsById.get(variantRef) : undefined
  const release = releaseRef ? releasesById.get(releaseRef) : undefined
  const variantTitle = variant ? getVariantTitle(variant) : t('document-group.base-variant')
  const releasePerspective = getReleasePerspective({release, version})

  const {
    displayTitle,
    fullTitle: releaseFullTitle,
    isTruncated,
  } = getVersionFilterLabel(releasePerspective, t, bundles)

  return buildVersionTitleResult({
    variantsEnabled,
    variantTitle,
    displayTitle,
    releaseFullTitle,
    isTruncated,
  })
}
