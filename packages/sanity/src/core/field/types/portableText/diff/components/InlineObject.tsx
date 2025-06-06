import {ChevronDownIcon} from '@sanity/icons'
import {
  isKeySegment,
  type ObjectSchemaType,
  type Path,
  type PortableTextChild,
  type PortableTextObject,
} from '@sanity/types'
import {Card, Flex, Text, useClickOutsideEvent} from '@sanity/ui'
import {FOCUS_TERMINATOR, toString} from '@sanity/util/paths'
import {type MouseEvent, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {DiffContext, ReviewChangesContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {Popover} from '../../../../../../ui-components'
import {useChangeIndicatorsReportedValues} from '../../../../../changeIndicators'
import {useTranslation} from '../../../../../i18n'
import {Preview} from '../../../../../preview/components/Preview'
import {ChangeList, DiffTooltip, useDiffAnnotationColor} from '../../../../diff'
import {type ObjectDiff} from '../../../../types'
import {isEmptyObject} from '../helpers'
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
  const {t} = useTranslation()
  if (!schemaType) {
    return (
      <InlineObjectWrapper {...restProps} border radius={1}>
        {t('changes.portable-text.unknown-inline-object-schema-type', {schemaType: object._type})}
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
  const {onSetFocus} = useContext(ReviewChangesContext)
  const {t} = useTranslation()
  const color = useDiffAnnotationColor(diff, [])
  const style = useMemo(
    () => (color ? {background: color.background, color: color.text} : {}),
    [color],
  )
  const [open, setOpen] = useState(false)
  const emptyObject = object && isEmptyObject(object)
  const isRemoved = diff.action === 'removed'
  const prefix = fullPath.slice(
    0,
    fullPath.findIndex((seg) => isKeySegment(seg) && seg._key === object._key),
  )
  const myPath = prefix.concat(path)
  const myValue = `field-${toString(myPath)}`
  const values = useChangeIndicatorsReportedValues()
  const isEditing = values.filter(([p]) => p.startsWith(myValue)).length > 0

  const focusPath = fullPath.slice(0, -1).concat(path).concat([FOCUS_TERMINATOR])

  useEffect(() => {
    if (isEditing) {
      setOpen(true)
      onSetFocus(focusPath)
    }
  }, [focusPath, isEditing, onSetFocus])

  const handleOpenPopup = useCallback(
    (event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
      event.stopPropagation()
      setOpen(true)
      if (!isRemoved) {
        onSetFocus(focusPath)
        return
      }
      event.preventDefault()
    },
    [focusPath, isRemoved, onSetFocus],
  )

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const value = useMemo(() => ({path: myPath}), [myPath])

  const popoverContent = (
    <DiffContext.Provider value={value}>
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
          <DiffTooltip
            annotations={annotations}
            description={t('changes.portable-text.inline-object', {context: diff.action})}
          >
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
  const {t} = useTranslation()
  const popoverRef = useRef<HTMLDivElement | null>(null)

  useClickOutsideEvent(onClose, () => [popoverRef.current])

  return (
    <PopoverContainer ref={popoverRef} padding={3}>
      {emptyObject && (
        <Text muted size={1} weight="medium">
          {t('changes.portable-text.empty-inline-object', {
            inlineObjectType: schemaType.title || schemaType.name,
          })}
        </Text>
      )}
      {!emptyObject && <ChangeList diff={diff} schemaType={schemaType} />}
    </PopoverContainer>
  )
}
