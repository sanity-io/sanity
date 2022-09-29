import {FolderIcon, ChevronRightIcon, DocumentIcon} from '@sanity/icons'
import {isSanityDocument, PreviewValue, SanityDocument, SchemaType} from '@sanity/types'
import {Text} from '@sanity/ui'
import React, {ReactNode, useCallback, useEffect, useMemo, useState} from 'react'
import {MissingSchemaType} from '../MissingSchemaType'
import {usePaneRouter} from '../paneRouter'
import {PaneItemPreview} from './PaneItemPreview'
import {
  FIXME,
  GeneralPreviewLayoutKey,
  PreviewCard,
  SanityDefaultPreview,
  useDocumentPresence,
  useDocumentPreviewStore,
  useSchema,
} from 'sanity'

interface PaneItemProps {
  id: string
  layout?: GeneralPreviewLayoutKey
  icon?: React.ComponentType<any> | false
  pressed?: boolean
  selected?: boolean
  title?: string
  value?: PreviewValue | SanityDocument
  schemaType?: SchemaType
}

/**
 * Return `false` if we explicitly disable the icon.
 * Otherwise return the passed icon or the schema type icon as a backup.
 */
export function getIconWithFallback(
  icon: React.ComponentType<any> | false | undefined,
  schemaType: SchemaType | undefined,
  defaultIcon: React.ComponentType<any>
): React.ComponentType<any> | false {
  if (icon === false) {
    return false
  }

  return icon || (schemaType && schemaType.icon) || defaultIcon || false
}

export function PaneItem(props: PaneItemProps) {
  const {icon, id, layout = 'default', pressed, schemaType, selected, title, value} = props
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

    return (
      <SanityDefaultPreview
        status={
          <Text muted>
            <ChevronRightIcon />
          </Text>
        }
        icon={getIconWithFallback(icon, schemaType, FolderIcon)}
        layout={layout}
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

  const Link = useMemo(
    () =>
      function LinkComponent(linkProps: {children: ReactNode}) {
        return <ChildLink {...linkProps} childId={id} />
      },
    [ChildLink, id]
  )

  const handleClick = useCallback(() => setClicked(true), [])

  // Reset `clicked` state when `selected` prop changes
  useEffect(() => setClicked(false), [selected])

  return (
    <PreviewCard
      __unstable_focusRing
      as={Link as FIXME}
      data-as="a"
      data-ui="PaneItem"
      padding={2}
      radius={2}
      onClick={handleClick}
      pressed={pressed}
      selected={selected || clicked}
      tone="inherit"
    >
      {preview}
    </PreviewCard>
  )
}
