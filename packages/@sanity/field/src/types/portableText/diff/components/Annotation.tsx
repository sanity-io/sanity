import {useClickOutside, Label, Popover, Flex} from '@sanity/ui'
import {toString} from '@sanity/util/paths'
import {isKeySegment, Path} from '@sanity/types'
import React, {useCallback, useEffect, useState} from 'react'
import {ConnectorContext, useReportedValues} from '@sanity/base/lib/change-indicators'
import styled from 'styled-components'
import {ChevronDownIcon} from '@sanity/icons'
import {
  ChangeList,
  DiffContext,
  DiffTooltip,
  ObjectDiff,
  ObjectSchemaType,
  useDiffAnnotationColor,
} from '../../../../diff'
import {PortableTextChild} from '../types'
import {isEmptyObject} from '../helpers'
import {InlineBox, InlineText, PopoverContainer, PreviewContainer} from './styledComponents'

interface AnnotationProps {
  diff?: ObjectDiff
  object: PortableTextChild
  schemaType?: ObjectSchemaType
  path: Path
  children: React.ReactNode
}

const AnnotationWrapper = styled.div`
  text-decoration: none;
  display: inline;
  position: relative;
  border: 0;
  padding: 0;
  border-bottom: 2px dotted currentColor;
  box-shadow: inset 0 0 0 1px var(--card-border-color);
  white-space: nowrap;
  align-items: center;
  background-color: color(var(--card-fg-color) a(10%));

  &[data-changed] {
    cursor: pointer;
  }

  &[data-removed] {
    text-decoration: line-through;
  }

  &:hover ${PreviewContainer} {
    opacity: 1;
  }
`

export function Annotation({
  children,
  diff,
  object,
  schemaType,
  path,
  ...restProps
}: AnnotationProps) {
  if (!schemaType) {
    return <AnnotationWrapper {...restProps}>Unknown schema type</AnnotationWrapper>
  }
  if (diff && diff.action !== 'unchanged') {
    return (
      <AnnnotationWithDiff
        {...restProps}
        diff={diff}
        object={object}
        schemaType={schemaType}
        path={path}
      >
        {children}
      </AnnnotationWithDiff>
    )
  }
  return <AnnotationWrapper>{children}</AnnotationWrapper>
}

interface AnnnotationWithDiffProps {
  diff: ObjectDiff
  object: PortableTextChild
  schemaType: ObjectSchemaType
  path: Path
  children?: React.ReactNode
}

function AnnnotationWithDiff({
  diff,
  children,
  object,
  schemaType,
  path,
  ...restProps
}: AnnnotationWithDiffProps) {
  const {onSetFocus} = React.useContext(ConnectorContext)
  const {path: fullPath} = React.useContext(DiffContext)
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const color = useDiffAnnotationColor(diff, [])
  const style = color ? {background: color.background, color: color.text} : {}
  const isRemoved = diff.action === 'removed'
  const [open, setOpen] = useState(false)
  const emptyObject = object && isEmptyObject(object)
  const markDefPath = [path[0]].concat(['markDefs', {_key: object._key}])
  const prefix = fullPath.slice(
    0,
    fullPath.findIndex((seg) => isKeySegment(seg) && seg._key === object._key)
  )
  const annotationPath = prefix.concat(path)
  const myPath = prefix.concat(markDefPath)
  const myValue = `field-${toString(myPath)}`
  const values = useReportedValues()
  const isEditing = values.filter(([p]) => p.startsWith(myValue)).length > 0

  useEffect(() => {
    if (!open && isEditing) {
      setOpen(true)
      onSetFocus(myPath)
    }
  }, [isEditing, open])

  const handleOpenPopup = useCallback(
    (event) => {
      event.stopPropagation()
      setOpen(true)
      if (!isRemoved) {
        event.preventDefault()
        onSetFocus(annotationPath) // Go to span first
        setTimeout(() => onSetFocus(myPath), 10) // Open edit object interface
      }
    },
    [annotationPath]
  )

  const handleClickOutside = useCallback(() => {
    if (!isEditing) {
      setOpen(false)
    }
  }, [isEditing])

  useClickOutside(handleClickOutside, [popoverElement])

  const annotation = (diff.action !== 'unchanged' && diff.annotation) || null
  const annotations = annotation ? [annotation] : []

  const popoverContent = (
    <DiffContext.Provider value={{path: myPath}}>
      <PopoverContainer padding={3}>
        <div>
          {emptyObject && (
            <Label size={1} muted>
              Empty {schemaType.title}
            </Label>
          )}
          {!emptyObject && <ChangeList diff={diff} schemaType={schemaType} />}
        </div>
      </PopoverContainer>
    </DiffContext.Provider>
  )
  return (
    <AnnotationWrapper
      {...restProps}
      onClick={handleOpenPopup}
      style={style}
      data-changed=""
      data-removed={diff.action === 'removed' ? '' : undefined}
    >
      <Popover content={popoverContent} open={open} ref={setPopoverElement} portal>
        <PreviewContainer paddingLeft={1}>
          <DiffTooltip annotations={annotations} description={`${diff.action} annotation`}>
            <InlineBox style={{display: 'inline-flex'}}>
              <span>{children}</span>
              <Flex align="center" paddingX={1}>
                <InlineText size={0}>
                  <ChevronDownIcon />
                </InlineText>
              </Flex>
            </InlineBox>
          </DiffTooltip>
        </PreviewContainer>
      </Popover>
    </AnnotationWrapper>
  )
}
