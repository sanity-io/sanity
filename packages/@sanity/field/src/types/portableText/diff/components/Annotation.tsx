import {useClickOutside} from '@sanity/ui'
import {toString} from '@sanity/util/paths'
import classNames from 'classnames'
import {isKeySegment, Path} from '@sanity/types'
import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback, useEffect, useState} from 'react'
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
import styles from './Annotation.css'

interface AnnotationProps {
  diff?: ObjectDiff
  object: PortableTextChild
  children: JSX.Element
  schemaType?: ObjectSchemaType
  path: Path
}

export function Annotation({
  children,
  diff,
  object,
  schemaType,
  path,
  ...restProps
}: AnnotationProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  if (!schemaType) {
    return (
      <span {...restProps} className={styles.root}>
        Unknown schema type
      </span>
    )
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
  return <span className={styles.root}>{children}</span>
}

interface AnnnotationWithDiffProps {
  diff: ObjectDiff
  object: PortableTextChild
  schemaType: ObjectSchemaType
  path: Path
}

function AnnnotationWithDiff({
  diff,
  children,
  object,
  schemaType,
  path,
  ...restProps
}: AnnnotationWithDiffProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  const {onSetFocus} = React.useContext(ConnectorContext)
  const {path: fullPath} = React.useContext(DiffContext)
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const color = useDiffAnnotationColor(diff, [])
  const style = color ? {background: color.background, color: color.text} : {}
  const isRemoved = diff.action === 'removed'
  const className = classNames(
    styles.root,
    styles.isChanged,
    diff.action === 'removed' && styles.removed
  )
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
      <div className={styles.popoverContainer}>
        <div className={styles.popoverContent}>
          {emptyObject && <span className={styles.empty}>Empty {schemaType.title}</span>}
          {!emptyObject && <ChangeList diff={diff} schemaType={schemaType} />}
        </div>
      </div>
    </DiffContext.Provider>
  )
  return (
    <span {...restProps} className={className} onClick={handleOpenPopup} style={style}>
      <Popover content={popoverContent} open={open} ref={setPopoverElement}>
        <span className={styles.previewContainer}>
          <DiffTooltip annotations={annotations} description={`${diff.action} annotation`}>
            <span>
              <span>{children}</span>
              <ChevronDownIcon />
            </span>
          </DiffTooltip>
        </span>
      </Popover>
    </span>
  )
}
