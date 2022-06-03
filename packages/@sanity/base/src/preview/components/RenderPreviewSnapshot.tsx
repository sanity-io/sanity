import React, {ComponentType} from 'react'
import {isReferenceSchemaType, PreviewValue, SanityDocumentLike, SchemaType} from '@sanity/types'
import {get} from 'lodash'
import {PreviewLayoutKey, PreviewProps} from '../../components/previews'
import {isRecord} from '../../util/isRecord'
import {SanityDefaultPreview} from './SanityDefaultPreview'

export interface RenderPreviewSnapshotProps extends PreviewProps {
  error?: Error
  isLoading: boolean
  layout?: PreviewLayoutKey
  snapshot?: SanityDocumentLike | PreviewValue | null
  schemaType: SchemaType
}

function resolvePreview(type: SchemaType): ComponentType<
  PreviewProps & {
    error?: Error
    icon?: ComponentType
    isLoading?: boolean
    schemaType?: SchemaType
  }
> {
  const fromPreview = get(type, 'preview.component')

  if (fromPreview) {
    return fromPreview
  }

  return SanityDefaultPreview as ComponentType<
    PreviewProps & {
      error?: Error
      icon?: ComponentType
      isLoading?: boolean
      schemaType?: SchemaType
    }
  >
}

export function RenderPreviewSnapshot(props: RenderPreviewSnapshotProps) {
  const {snapshot, schemaType, isLoading, ...restProps} = props
  const PreviewComponent = resolvePreview(schemaType)
  const typeName = isRecord(snapshot?._internalMeta) ? snapshot?._internalMeta._type : undefined
  const icon =
    (isReferenceSchemaType(schemaType) && schemaType.to.find((t) => t.name === typeName)?.icon) ||
    schemaType.icon

  const preview = snapshot ? (
    <PreviewComponent
      media={icon}
      {...restProps}
      icon={icon}
      isLoading={isLoading}
      isPlaceholder={!snapshot}
      schemaType={schemaType}
      value={snapshot || undefined}
    />
  ) : (
    <></>
  )

  return preview
}
