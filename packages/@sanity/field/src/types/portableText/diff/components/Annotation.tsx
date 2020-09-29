import classNames from 'classnames'
import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback, useState} from 'react'
import {ChangeList, ObjectDiff, ObjectSchemaType, useDiffAnnotationColor} from '../../../../diff'
import {PortableTextChild} from '../types'
import {isEmptyObject} from '../helpers'

import styles from './Annotation.css'

interface AnnotationProps {
  diff?: ObjectDiff
  object: PortableTextChild
  children: JSX.Element
  schemaType?: ObjectSchemaType
}

export function Annotation({
  children,
  diff,
  schemaType,
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
      <AnnnotationWithDiff {...restProps} diff={diff} schemaType={schemaType}>
        {children}
      </AnnnotationWithDiff>
    )
  }
  return (
    <span className={styles.root} {...restProps}>
      {children}
    </span>
  )
}

interface AnnnotationWithDiffProps {
  diff: ObjectDiff
  object: PortableTextChild
  schemaType: ObjectSchemaType
}

function AnnnotationWithDiff({
  diff,
  children,
  object,
  schemaType,
  ...restProps
}: AnnnotationWithDiffProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  const color = useDiffAnnotationColor(diff, [])
  const style = color ? {background: color.background, color: color.text} : {}
  const className = classNames(styles.root, diff.action === 'removed' && styles.removed)
  const [open, setOpen] = useState(false)
  const emptyObject = object && isEmptyObject(object)

  const handleClick = useCallback(() => {
    setOpen(true)
  }, [])

  const popoverContent = (
    <div className={styles.popoverContent}>
      {emptyObject && <span>Empty {schemaType.title}</span>}
      {!emptyObject && <ChangeList diff={diff} schemaType={schemaType} />}
    </div>
  )

  const handleClickOutside = useCallback(() => {
    setOpen(false)
  }, [])
  return (
    <ClickOutside onClickOutside={handleClickOutside}>
      {ref => (
        <span {...restProps} className={className} onClick={handleClick} ref={ref} style={style}>
          <Popover content={popoverContent} open={open}>
            <span className={styles.previewContainer}>
              <span>{children}</span>
            </span>
          </Popover>
        </span>
      )}
    </ClickOutside>
  )
}
