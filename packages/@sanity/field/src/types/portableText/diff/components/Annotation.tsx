import classNames from 'classnames'
import {Path} from '@sanity/types'
import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import LinkIcon from 'part:@sanity/base/link-icon'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback, useState} from 'react'
import {ConnectorContext} from '@sanity/base/lib/change-indicators'
import {
  ChangeList,
  ObjectDiff,
  ObjectSchemaType,
  useDiffAnnotationColor,
  DiffContext
} from '../../../../diff'
import {PortableTextChild} from '../types'
import {isEmptyObject} from '../helpers'
import styles from './Annotation.css'

interface AnnotationProps {
  diff?: ObjectDiff
  object: PortableTextChild
  children: JSX.Element
  schemaType?: ObjectSchemaType
  spanPath: Path
}

export function Annotation({
  children,
  diff,
  object,
  schemaType,
  spanPath,
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
        spanPath={spanPath}
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
  spanPath: Path
}

function AnnnotationWithDiff({
  diff,
  children,
  object,
  schemaType,
  spanPath,
  ...restProps
}: AnnnotationWithDiffProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  const {onSetFocus} = React.useContext(ConnectorContext)
  const {path} = React.useContext(DiffContext)
  const color = useDiffAnnotationColor(diff, [])
  const style = color ? {background: color.background, color: color.text} : {}
  const className = classNames(
    styles.root,
    styles.isChanged,
    diff.action === 'removed' && styles.removed
  )
  const [open, setOpen] = useState(false)
  const emptyObject = object && isEmptyObject(object)
  const focusPath = path.slice(0, -1).concat(spanPath)
  const annotationPath = path.concat(['markDefs', {_key: object._key}, '$'])
  const handleOpen = useCallback(
    event => {
      event.stopPropagation()
      setOpen(true)
      onSetFocus(focusPath)
    },
    [focusPath]
  )
  const handleGoto = useCallback(
    event => {
      event.stopPropagation()
      setOpen(true)
      onSetFocus(annotationPath)
    },
    [annotationPath]
  )

  const popoverContent = (
    <div className={styles.popoverContainer}>
      <div className={styles.goToLink}>
        <span onClick={handleGoto}>
          <LinkIcon /> Open
        </span>
      </div>
      <div className={styles.popoverContent}>
        {emptyObject && <span className={styles.empty}>Empty {schemaType.title}</span>}
        {!emptyObject && <ChangeList diff={diff} schemaType={schemaType} />}
      </div>
    </div>
  )

  const handleClickOutside = useCallback(() => {
    setOpen(false)
  }, [])
  return (
    <ClickOutside onClickOutside={handleClickOutside}>
      {ref => (
        <span {...restProps} className={className} onClick={handleOpen} ref={ref} style={style}>
          <Popover content={popoverContent} open={open}>
            <span className={styles.previewContainer}>
              <span>{children}</span>
              <ChevronDownIcon />
            </span>
          </Popover>
        </span>
      )}
    </ClickOutside>
  )
}
