import {LockIcon} from '@sanity/icons/Lock'
import {
  Badge,
  // oxlint-disable-next-line no-restricted-imports -- we need more control over how the `Button` component is rendered
  Button,
  Flex,
  LayerProvider,
  useClickOutsideEvent,
} from '@sanity/ui'
import {type ComponentType, type RefObject, useMemo, useRef, useState} from 'react'
import {
  DocumentGroupInventory,
  DocumentVersionIcons,
  getPublishedId,
  getReleaseTone,
  getVersionFromId,
  isAgentBundleName,
  isReleaseScheduledOrScheduling,
  type ReleaseDocument,
  useActiveReleases,
  useAllVariants,
  useDocumentVersions,
  useDocumentVersionTitle,
  useTranslation,
  type VersionInfoDocumentStub,
} from 'sanity'

import {Popover} from '../../../../ui-components/popover/Popover'
import {structureLocaleNamespace} from '../../../i18n'

/**
 * A document selector driven by the document group inventory's sets: lists every version of the
 * document group (variants, releases, draft/published, anonymous bundles) and navigates the diff
 * view to the picked document.
 */
export const DocumentGroupPickerMenu: ComponentType<{
  role: 'previous' | 'next'
  document: {
    type: string
    id: string
  }
  onSelectDocument: (documentId: string) => void
}> = ({role, document, onSelectDocument}) => {
  const {t: tCore} = useTranslation()
  const {t: tStructure} = useTranslation(structureLocaleNamespace)
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const {versions} = useDocumentVersions({documentId: getPublishedId(document.id)})
  const version = versions.find((v) => v._id === document.id)
  const {loading: variantsLoading, error: variantsError} = useAllVariants()
  const {byId: releasesById, loading: releasesLoading, error: releasesError} = useActiveReleases()

  const release = version?._system.release?._ref
    ? releasesById.get(version._system.release?._ref)
    : undefined

  useClickOutsideEvent(
    () => setOpen(false),
    () => [buttonRef.current, popoverRef.current],
  )

  if (variantsError || releasesError) {
    return (
      <Badge tone="critical" radius={3}>
        {tStructure(
          variantsError
            ? 'compare-version.error.loadVersions.title'
            : 'compare-version.error.loadReleases.title',
        )}
      </Badge>
    )
  }

  const handleClick = () => setOpen((currentOpen) => !currentOpen)

  return (
    <LayerProvider>
      <Popover
        ref={popoverRef}
        content={
          <DocumentGroupInventory
            mode="readOnly"
            documentId={document.id}
            documentType={document.type}
            selectedId={document.id}
            onSelect={(selected) => {
              setOpen(false)
              onSelectDocument(selected._id)
            }}
          />
        }
        placement="bottom-start"
        padding={0}
        open={open}
        portal
      >
        {version ? (
          <DocumentGroupPickerButton
            ref={buttonRef}
            role={role}
            onClick={() => setOpen((currentOpen) => !currentOpen)}
            version={version}
            release={release}
          />
        ) : (
          <Button
            type="button"
            mode="ghost"
            padding={2}
            ref={buttonRef}
            data-testid={`diff-view-document-picker-${role}`}
            onClick={handleClick}
            iconRight={
              release && isReleaseScheduledOrScheduling(release) ? <LockIcon /> : undefined
            }
            tone={'neutral'}
            text={
              variantsLoading || releasesLoading
                ? tCore('common.loading')
                : (getVersionFromId(document.id) ?? document.id)
            }
          />
        )}
      </Popover>
    </LayerProvider>
  )
}

function DocumentGroupPickerButton({
  role,
  ref,
  onClick,
  version,
  release,
}: {
  ref: RefObject<HTMLButtonElement | null>
  release: ReleaseDocument | undefined
  role: 'previous' | 'next'
  onClick: () => void
  version: VersionInfoDocumentStub
}) {
  const {title, isTruncated, fullTitle} = useDocumentVersionTitle({version})

  const isDraftVersion = version._system.bundleId === 'drafts'
  const isPublishedVersion = !version._system.bundleId

  const tone = useMemo(() => {
    if (isAgentBundleName(version._system.bundleId)) {
      return 'suggest'
    }
    if (isDraftVersion || isPublishedVersion) {
      return isPublishedVersion ? 'positive' : 'neutral'
    }
    if (release) {
      return getReleaseTone(release)
    }
    return 'neutral'
  }, [version, isDraftVersion, isPublishedVersion, release])

  return (
    <Button
      type="button"
      mode="ghost"
      padding={2}
      ref={ref}
      data-testid={`diff-view-document-picker-${role}`}
      onClick={onClick}
      iconRight={release && isReleaseScheduledOrScheduling(release) ? <LockIcon /> : undefined}
      tone={tone}
      text={
        <Flex gap={1}>
          <DocumentVersionIcons version={version} />
          <span title={isTruncated ? fullTitle : undefined}>{title}</span>
        </Flex>
      }
      style={{
        maxWidth: 'calc(100% - 50px)',
        textOverflow: 'ellipsis',
      }}
    />
  )
}
