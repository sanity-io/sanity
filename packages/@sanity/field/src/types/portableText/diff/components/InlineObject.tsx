import {FOCUS_TERMINATOR, toString} from '@sanity/util/paths'
import classNames from 'classnames'
import {isKeySegment, Path} from '@sanity/types'
import {useClickOutside, useLayer} from '@sanity/ui'
import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import SanityPreview from 'part:@sanity/base/preview'
import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback, useState, useEffect} from 'react'
import {ConnectorContext, useReportedValues} from '@sanity/base/lib/change-indicators'
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

import styles from './InlineObject.css'

interface InlineObjectProps {
  diff?: ObjectDiff
  object: PortableTextChild
  path: Path
  schemaType?: ObjectSchemaType
}

export function InlineObject({
  diff,
  object,
  schemaType,
  ...restProps
}: InlineObjectProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  if (!schemaType) {
    return (
      <span {...restProps} className={styles.root}>
        Unknown schema type: {object._type}
      </span>
    )
  }

  if (diff) {
    return (
      <InlineObjectWithDiff {...restProps} diff={diff} object={object} schemaType={schemaType} />
    )
  }

  return (
    <span {...restProps} className={styles.root}>
      <SanityPreview type={schemaType} value={object} layout="inline" />
    </span>
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
}: InlineObjectWithDiffProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  const {path: fullPath} = React.useContext(DiffContext)
  const {onSetFocus} = React.useContext(ConnectorContext)
  const color = useDiffAnnotationColor(diff, [])
  const style = color ? {background: color.background, color: color.text} : {}
  const className = classNames(styles.root, diff.action === 'removed' && styles.removed)
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
    (event) => {
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
    <span {...restProps} className={className} onClick={handleOpenPopup} style={style}>
      <Popover content={popoverContent} layer open={open} portal>
        <span className={styles.previewContainer}>
          <DiffTooltip annotations={annotations} description={`${diff.action} inline object`}>
            <span>
              <SanityPreview type={schemaType} value={object} layout="inline" />
              <ChevronDownIcon />
            </span>
          </DiffTooltip>
        </span>
      </Popover>
    </span>
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
  const {isTopLayer} = useLayer()

  const handleClickOutside = useCallback(() => {
    if (!isTopLayer) return
    onClose()
  }, [isTopLayer, onClose])

  useClickOutside(handleClickOutside, [popoverElement])

  return (
    <div className={styles.popoverContent} ref={setPopoverElement}>
      {emptyObject && <span className={styles.empty}>Empty {schemaType.title}</span>}
      {!emptyObject && <ChangeList diff={diff} schemaType={schemaType} />}
    </div>
  )
}
