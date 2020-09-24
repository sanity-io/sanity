import classNames from 'classnames'
import SanityPreview from 'part:@sanity/base/preview'
import React from 'react'
import {DiffTooltip, ObjectDiff, ObjectSchemaType, useDiffAnnotationColor} from '../../../../diff'
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
}: InlineObjectProps & React.HTMLProps<HTMLSpanElement>) {
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
}: InlineObjectWithDiffProps & React.HTMLProps<HTMLSpanElement>) {
  const color = useDiffAnnotationColor(diff, [])
  const style = color ? {background: color.background, color: color.text} : {}
  const className = classNames(styles.root, diff.action === 'removed' && styles.removed)

  return (
    <DiffTooltip diff={diff}>
      <span {...restProps} className={className} style={style}>
        <SanityPreview type={schemaType} value={object} layout="inline" />
      </span>
    </DiffTooltip>
  )
}
