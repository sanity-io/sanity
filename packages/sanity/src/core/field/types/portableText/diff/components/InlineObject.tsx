import {ChevronDownIcon} from '@sanity/icons'
import {
  isKeySegment,
  ObjectSchemaType,
  Path,
  PortableTextChild,
  PortableTextObject,
} from '@sanity/types'
import {Card, Flex, Label, Popover, useClickOutside} from '@sanity/ui'
import {FOCUS_TERMINATOR, toString} from '@sanity/util/paths'
import React, {useCallback, useContext, useState, useEffect, useMemo} from 'react'
import styled from 'styled-components'
import {ChangeList, DiffContext, DiffTooltip, useDiffAnnotationColor} from '../../../../diff'
import {ObjectDiff} from '../../../../types'
import {isEmptyObject} from '../helpers'
import {ConnectorContext, useReportedValues} from '../../../../../changeIndicators'
import {Preview} from '../../../../../preview/components/Preview'
import {InlineBox, InlineText, PopoverContainer, PreviewContainer} from './styledComponents'

interface InlineObjectProps {
  diff?: ObjectDiff
  object: PortableTextObject
  path: Path
  schemaType?: ObjectSchemaType
}

const InlineObjectWrapper = styled(Card)`
  &:not([hidden]) {
    display: inline;
    cursor: pointer;
    white-space: nowrap;
    align-items: center;

    &[data-removed] {
      text-decoration: line-through;
    }

    ${InlineBox} {
      display: inline-flex;
    }
  }
`

export function InlineObject({diff, object, schemaType, ...restProps}: InlineObjectProps) {
  if (!schemaType) {
    return (
      <InlineObjectWrapper {...restProps} border radius={1}>
        Unknown schema type: {object._type}
      </InlineObjectWrapper>
    )
  }

  if (diff) {
    return (
      <InlineObjectWithDiff {...restProps} diff={diff} object={object} schemaType={schemaType} />
    )
  }

  return (
    <InlineObjectWrapper>
      <Preview schemaType={schemaType} value={object} layout="inline" />
    </InlineObjectWrapper>
  )
}

interface InlineObjectWithDiffProps {
  diff: ObjectDiff
  object: PortableTextChild
  path: Path
  schemaType: ObjectSchemaType
}

function InlineObjectWithDiff({
  diff,
  object,
  path,
  schemaType,
  ...restProps
}: InlineObjectWithDiffProps) {
  const {path: fullPath} = useContext(DiffContext)
  const {onSetFocus} = useContext(ConnectorContext)
  const color = useDiffAnnotationColor(diff, [])
  const style = useMemo(
    () => (color ? {background: color.background, color: color.text} : {}),
    [color]
  )
  const [open, setOpen] = useState(false)
  const emptyObject = object && isEmptyObject(object)
  const isRemoved = diff.action === 'removed'
  const prefix = fullPath.slice(
    0,
    fullPath.findIndex((seg) => isKeySegment(seg) && seg._key === object._key)
  )
  const myPath = prefix.concat(path)
  const myValue = `field-${toString(myPath)}`
  const values = useReportedValues()
  const isEditing = values.filter(([p]) => p.startsWith(myValue)).length > 0

  const focusPath = fullPath.slice(0, -1).concat(path).concat([FOCUS_TERMINATOR])

  useEffect(() => {
    if (isEditing) {
      setOpen(true)
      onSetFocus(focusPath)
    }
  }, [isEditing])

  const handleOpenPopup = useCallback(
    (event: any) => {
      event.stopPropagation()
      setOpen(true)
      if (!isRemoved) {
        onSetFocus(focusPath)
        return
      }
      event.preventDefault()
    },
    [focusPath]
  )

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const popoverContent = (
    <DiffContext.Provider value={{path: myPath}}>
      <PopoverContent
        diff={diff}
        emptyObject={emptyObject}
        onClose={handleClose}
        schemaType={schemaType}
      />
    </DiffContext.Provider>
  )

  const annotation = (diff.action !== 'unchanged' && diff.annotation) || null
  const annotations = annotation ? [annotation] : []

  return (
    <InlineObjectWrapper
      {...restProps}
      onClick={handleOpenPopup}
      style={style}
      data-removed={diff.action === 'removed' ? '' : undefined}
      border
      radius={2}
    >
      <Popover content={popoverContent} open={open} portal>
        <PreviewContainer>
          <DiffTooltip annotations={annotations} description={`${diff.action} inline object`}>
            <InlineBox>
              <Preview schemaType={schemaType} value={object} layout="inline" />
              <Flex align="center" paddingX={1}>
                <InlineText size={0}>
                  <ChevronDownIcon />
                </InlineText>
              </Flex>
            </InlineBox>
          </DiffTooltip>
        </PreviewContainer>
      </Popover>
    </InlineObjectWrapper>
  )
}

function PopoverContent({
  diff,
  emptyObject,
  onClose,
  schemaType,
}: {
  diff: ObjectDiff
  emptyObject: boolean
  onClose: () => void
  schemaType: ObjectSchemaType
}) {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  // const {isTopLayer} = useLayer()

  const handleClickOutside = useCallback(() => {
    // Popover doesn't close at all when using this condition
    // if (!isTopLayer) return
    onClose()
  }, [onClose])

  useClickOutside(handleClickOutside, [popoverElement])

  return (
    <PopoverContainer ref={setPopoverElement} padding={3}>
      {emptyObject && (
        <Label size={1} muted>
          Empty {schemaType.title}
        </Label>
      )}
      {!emptyObject && <ChangeList diff={diff} schemaType={schemaType} />}
    </PopoverContainer>
  )
}
