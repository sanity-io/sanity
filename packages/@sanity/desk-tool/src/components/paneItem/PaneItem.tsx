import React, {forwardRef, useCallback, useEffect, useMemo, useState} from 'react'
import {FolderIcon, ChevronRightIcon, DocumentIcon} from '@sanity/icons'
import {isSanityDocument, SchemaType} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'
import {getIconWithFallback} from '../../utils/getIconWithFallback'
import {MissingSchemaType} from '../MissingSchemaType'
import {usePaneRouter} from '../../contexts/paneRouter'
import {PreviewValue} from '../../types'
import {PaneItemPreview} from './PaneItemPreview'

interface PaneItemProps {
  id: string
  layout?: 'inline' | 'block' | 'default' | 'card' | 'media' | 'detail'
  icon?: React.ComponentType<any> | false
  pressed?: boolean
  selected?: boolean
  title?: string
  value?: PreviewValue | {_id: string; _type: string}
  schemaType?: SchemaType
}

export function PaneItem(props: PaneItemProps) {
  const {icon, id, layout = 'default', pressed, schemaType, selected, title, value} = props
  const {ChildLink} = usePaneRouter()
  const hasSchemaType = Boolean(schemaType && schemaType.name && schema.get(schemaType.name))
  const previewValue = useMemo(() => ({title}), [title])
  const [clicked, setClicked] = useState(false)

  const preview = useMemo(() => {
    if (value && isSanityDocument(value)) {
      if (!schemaType || !hasSchemaType) {
        return <MissingSchemaType value={value} />
      }

      return (
        <PaneItemPreview
          icon={getIconWithFallback(icon, schemaType, DocumentIcon)}
          layout={layout}
          schemaType={schemaType}
          value={value}
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
        value={previewValue}
      />
    )
  }, [hasSchemaType, icon, layout, previewValue, schemaType, value])

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps: any, ref: any) {
        return <ChildLink {...linkProps} childId={id} ref={ref} />
      }),
    [ChildLink, id]
  )

  const handleClick = useCallback(() => setClicked(true), [])

  // Reset `clicked` state when `selected` prop changes
  useEffect(() => setClicked(false), [selected])

  return useMemo(
    () => (
      <Card
        __unstable_focusRing
        as={LinkComponent}
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
      </Card>
    ),
    [clicked, handleClick, LinkComponent, pressed, preview, selected]
  )
}
