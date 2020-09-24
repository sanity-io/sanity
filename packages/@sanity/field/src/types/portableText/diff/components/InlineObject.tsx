import classNames from 'classnames'
import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import SanityPreview from 'part:@sanity/base/preview'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback, useState} from 'react'
import {ChangeList, ObjectDiff, ObjectSchemaType, useDiffAnnotationColor} from '../../../../diff'
import {PortableTextChild} from '../types'

import styles from './InlineObject.css'

interface InlineObjectProps {
  diff?: ObjectDiff
  object: PortableTextChild
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
  schemaType: ObjectSchemaType
}

function InlineObjectWithDiff({
  diff,
  object,
  schemaType,
  ...restProps
}: InlineObjectWithDiffProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  const color = useDiffAnnotationColor(diff, [])
  const style = color ? {background: color.background, color: color.text} : {}
  const className = classNames(styles.root, diff.action === 'removed' && styles.removed)
  const [open, setOpen] = useState(false)

  const handleClick = useCallback(() => {
    setOpen(true)
  }, [])

  const popoverContent = (
    <div className={styles.popoverContent}>
      <ChangeList diff={diff} schemaType={schemaType} />
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
              <SanityPreview type={schemaType} value={object} layout="inline" />
              <ChevronDownIcon />
            </span>
          </Popover>
        </span>
      )}
    </ClickOutside>
  )
}
