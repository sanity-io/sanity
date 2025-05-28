import {ChevronRightIcon, DocumentIcon, FolderIcon} from '@sanity/icons'
import {
  isSanityDocument,
  type PreviewValue,
  type SanityDocument,
  type SchemaType,
} from '@sanity/types'
import {Box, type CardProps, Text} from '@sanity/ui'
import {
  type ComponentType,
  type MouseEvent,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  type FIXME,
  type GeneralPreviewLayoutKey,
  getPublishedId,
  PreviewCard,
  SanityDefaultPreview,
  useDocumentPresence,
  useDocumentPreviewStore,
  useEditState,
  useSchema,
} from 'sanity'

import {MissingSchemaType} from '../MissingSchemaType'
import {usePaneRouter} from '../paneRouter'
import {PaneItemPreview} from './PaneItemPreview'

interface PaneItemProps {
  id: string
  layout?: GeneralPreviewLayoutKey
  icon?: ComponentType<any> | false
  pressed?: boolean
  selected?: boolean
  title?: string
  value?: PreviewValue | SanityDocument
  schemaType?: SchemaType
  margin?: CardProps['margin']
  marginBottom?: CardProps['marginBottom']
  marginTop?: CardProps['marginTop']
}

/**
 * Return `false` if we explicitly disable the icon.
 * Otherwise return the passed icon or the schema type icon as a backup.
 */
export function getIconWithFallback(
  icon: ComponentType<any> | false | undefined,
  schemaType: SchemaType | undefined,
  defaultIcon: ComponentType<any>,
): ComponentType<any> | false {
  if (icon === false) {
    return false
  }

  return icon || (schemaType && schemaType.icon) || defaultIcon || false
}

export function PaneItem(props: PaneItemProps) {
  const {
    icon,
    id,
    layout = 'default',
    pressed,
    schemaType,
    selected,
    title,
    value,
    margin,
    marginBottom,
    marginTop,
  } = props
  const schema = useSchema()
  const documentPreviewStore = useDocumentPreviewStore()
  const {ChildLink} = usePaneRouter()
  const documentPresence = useDocumentPresence(id)
  const hasSchemaType = Boolean(schemaType && schemaType.name && schema.get(schemaType.name))
  const [clicked, setClicked] = useState<boolean>(false)

  const preview = useMemo(() => {
    if (value && isSanityDocument(value)) {
      if (!schemaType || !hasSchemaType) {
        return <MissingSchemaType value={value} />
      }

      return (
        <PaneItemPreview
          documentPreviewStore={documentPreviewStore}
          icon={getIconWithFallback(icon, schemaType, DocumentIcon)}
          layout={layout}
          schemaType={schemaType}
          value={value}
          presence={documentPresence}
        />
      )
    }

    // Always render non-document values as compact previews
    return (
      <SanityDefaultPreview
        status={
          <Box style={{opacity: 0.5}}>
            <Text muted size={1}>
              <ChevronRightIcon />
            </Text>
          </Box>
        }
        icon={getIconWithFallback(icon, schemaType, FolderIcon)}
        layout="compact"
        title={title}
      />
    )
  }, [
    documentPreviewStore,
    hasSchemaType,
    icon,
    layout,
    schemaType,
    title,
    value,
    documentPresence,
  ])

  const handleClick = useCallback((e: MouseEvent<HTMLElement>) => {
    if (e.metaKey) {
      setClicked(false)
      return
    }

    setClicked(true)
  }, [])

  // Reset `clicked` state when `selected` prop changes
  useEffect(() => setClicked(false), [selected])

  // Preloads the edit state on hover, using concurrent rendering with `startTransition` so preloads can be interrupted and not block rendering
  const [preloading, setPreload] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => startTransition(() => setPreload(true)), 400)
  }, [])
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    startTransition(() => setPreload(false))
  }, [])

  return (
    <PreviewCard
      data-testid={`pane-item-${title}`}
      __unstable_focusRing
      as={ChildLink as FIXME}
      // @ts-expect-error - `childId` is a valid prop on `ChildLink`
      childId={id}
      data-as="a"
      margin={margin}
      marginBottom={marginBottom}
      marginTop={marginTop}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      pressed={pressed}
      radius={2}
      selected={selected || clicked}
      sizing="border"
      tabIndex={-1}
      tone="inherit"
    >
      {preview}
      {preloading && schemaType?.name && value && isSanityDocument(value) && (
        <PreloadDocumentPane documentId={id} documentType={schemaType.name} />
      )}
    </PreviewCard>
  )
}

function PreloadDocumentPane(props: {documentId: string; documentType: string}) {
  const {documentId, documentType} = props
  // Preload the edit state for the document, and keep it alive until mouse leave
  useEditState(getPublishedId(documentId), documentType)

  return null
}
PreloadDocumentPane.displayName = 'PreloadDocumentPane'
