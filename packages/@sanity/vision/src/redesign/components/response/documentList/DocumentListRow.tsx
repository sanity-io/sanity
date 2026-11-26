import {DocumentIcon} from '@sanity/icons/Document'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Button} from '@sanity/ui'
import {type ReactNode, useCallback, useMemo} from 'react'
import {
  type PreviewProps,
  type PerspectiveStack,
  type SchemaType,
  useDataset,
  useProjectId,
} from 'sanity'
import {
  getPublishedId,
  getVersionFromId,
  isDraftId,
  useSchema,
  PreviewCard,
  SanityDefaultPreview,
  useValuePreview,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {useTranslation} from 'sanity/i18n'
import {useIntentLink} from 'sanity/router'

import {visionLocaleNamespace} from '../../../../i18n'
import {useCopyToClipboard} from '../../../hooks/useCopyToClipboard'
import {type DocumentListDocument} from '../../../util/documentListResult'
import {VisionTooltip} from '../../VisionTooltip'
import {CopyResultButton} from '../CopyResultButton'
import * as styles from './DocumentList.module.css'

function previewMedia(media: unknown): Pick<PreviewProps, 'imageUrl' | 'media'> {
  // A string is only safe as an image URL. Any other string is a component type to the preview.
  if (typeof media === 'string' && /^https?:\/\//.test(media)) return {imageUrl: media}
  // An object is an image source, or something the preview replaces with the type icon.
  if (isPreviewMedia(media)) return {media}
  return {}
}

function isPreviewMedia(media: unknown): media is NonNullable<PreviewProps['media']> {
  return typeof media === 'object' && media !== null && !Array.isArray(media)
}

const PUBLISHED_PERSPECTIVE: PerspectiveStack = []
const DRAFTS_PERSPECTIVE: PerspectiveStack = ['drafts']

/**
 * The perspective that sees the document an id names. The preview store observes the published id
 * through a perspective, and without one it only sees published documents.
 */
function previewPerspective(id: string): PerspectiveStack {
  if (isDraftId(id)) return DRAFTS_PERSPECTIVE
  const release = getVersionFromId(id)
  return release ? [release] : PUBLISHED_PERSPECTIVE
}

/**
 * One result row. A string `_type` opens the document when the result is from the workspace's dataset; without one the row is still the title,
 * subtitle, media and id from the result. An unknown type uses the plain document icon. A row for
 * a document in another project or dataset (a cross-dataset reference) never opens it.
 *
 * With `resolvePreview`, a row from the workspace's dataset whose type is in the schema shows the
 * live preview from that type's preview config instead, falling back to the id while it loads or
 * when the preview has no title.
 */
export function DocumentListRow({
  document,
  linkDocuments,
  resolvePreview = false,
}: {
  document: DocumentListDocument
  linkDocuments: boolean
  resolvePreview?: boolean
}) {
  const schema = useSchema()
  const projectId = useProjectId()
  const dataset = useDataset()
  const isRemote =
    (document._projectId !== undefined && document._projectId !== projectId) ||
    (document._dataset !== undefined && document._dataset !== dataset)
  const type = linkDocuments && !isRemote ? document._type : undefined
  const schemaType = document._type ? schema.get(document._type) : undefined
  const preview =
    resolvePreview && type && schemaType ? (
      <ResolvedPreview document={document} schemaType={schemaType} type={type} />
    ) : (
      <ResultPreview document={document} icon={schemaType?.icon} />
    )

  return (
    <div className={styles.row} data-testid="vision-document-list-row">
      {type ? (
        <DocumentLinkCard id={document._id} type={type}>
          {preview}
        </DocumentLinkCard>
      ) : (
        <PreviewCard __unstable_focusRing as="div" radius={2} tone="inherit">
          {preview}
        </PreviewCard>
      )}
      <div className={styles.rowActions}>
        <CopyIdButton id={document._id} />
        {type ? <OpenInNewTabButton id={document._id} type={type} /> : null}
      </div>
    </div>
  )
}

function ResultPreview({
  document,
  icon,
}: {
  document: DocumentListDocument
  icon: SchemaType['icon']
}) {
  const media = useMemo(() => previewMedia(document.media), [document.media])
  return (
    <SanityDefaultPreview
      icon={icon ?? DocumentIcon}
      layout="default"
      subtitle={document.subtitle}
      title={document.title ?? document._id}
      {...media}
    />
  )
}

function ResolvedPreview({
  document,
  schemaType,
  type,
}: {
  document: DocumentListDocument
  schemaType: SchemaType
  type: string
}) {
  const value = useMemo(() => ({_id: document._id, _type: type}), [document._id, type])
  const perspectiveStack = useMemo(() => previewPerspective(document._id), [document._id])
  const {value: resolved} = useValuePreview({
    perspectiveStack,
    schemaType,
    value,
  })
  const title = typeof resolved?.title === 'string' && resolved.title ? resolved.title : undefined
  return (
    <SanityDefaultPreview
      icon={schemaType.icon ?? DocumentIcon}
      layout="default"
      media={resolved?.media}
      subtitle={title ? (resolved?.subtitle ?? document._id) : document.subtitle}
      title={title ?? document.title ?? document._id}
    />
  )
}

/** Opens the document with an edit intent; a modified click opens it in a new tab */
function DocumentLinkCard({id, type, children}: {id: string; type: string; children: ReactNode}) {
  const params = useMemo(() => ({id: getPublishedId(id), type}), [id, type])
  const {href, onClick} = useIntentLink({intent: 'edit', params})
  return (
    <PreviewCard
      __unstable_focusRing
      as="a"
      data-as="a"
      data-testid="vision-document-list-link"
      href={href}
      onClick={onClick}
      radius={2}
      tone="inherit"
    >
      {children}
    </PreviewCard>
  )
}

function OpenInNewTabButton({id, type}: {id: string; type: string}) {
  const {t} = useTranslation(visionLocaleNamespace)
  const params = useMemo(() => ({id: getPublishedId(id), type}), [id, type])
  const {href} = useIntentLink({intent: 'edit', params})
  const label = t('vision.result.documents.open-new-tab')
  return (
    <VisionTooltip content={label} placement="bottom">
      <Button
        aria-label={label}
        as="a"
        data-testid="vision-document-list-open"
        fontSize={1}
        href={href}
        icon={LaunchIcon}
        mode="bleed"
        padding={2}
        rel="noopener noreferrer"
        target="_blank"
      />
    </VisionTooltip>
  )
}

function CopyIdButton({id}: {id: string}) {
  const {t} = useTranslation(visionLocaleNamespace)
  const copyToClipboard = useCopyToClipboard()
  const onCopy = useCallback(
    () => copyToClipboard(id, t('vision.result.documents.copied-id', {id})),
    [copyToClipboard, id, t],
  )
  return (
    <CopyResultButton
      iconOnly
      label={t('vision.result.documents.copy-id')}
      onCopy={onCopy}
      testId="vision-document-list-copy-id"
    />
  )
}
