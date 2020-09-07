import React from 'react'
import {Path} from '../../paths'
import {PreviewComponent} from '../../preview/types'
import {DiffAnnotationTooltip, getAnnotationAtPath, useAnnotationColor} from '../annotations'
import {Diff as DiffType, SchemaType} from '../../types'
import {ChangeLayout} from './ChangeLayout'
import styles from './Change.css'

interface ChangeProps {
  previewComponent: PreviewComponent<any>
  diff: DiffType
  schemaType: SchemaType
  path?: Path | string
  layout?: 'grid' | 'inline'
  className?: string
  children?: React.ReactNode
}

export function Change({
  layout = 'inline',
  diff,
  path,
  className,
  schemaType,
  previewComponent: PreviewComponent
}: ChangeProps) {
  const containerClassName = className ? `${styles.root} ${className}` : styles.root
  const {fromValue, toValue, action} = diff
  const annotation = getAnnotationAtPath(diff, path || [])
  const color = useAnnotationColor(annotation)
  const colorStyle = color ? {background: color.background, color: color.text} : {}

  if (action === 'unchanged') {
    return <PreviewComponent value={toValue} schemaType={schemaType} />
  }

  const from = hasValue(fromValue) ? (
    <DiffAnnotationTooltip
      as="del"
      className={styles.remove}
      annotation={annotation}
      style={colorStyle}
    >
      <PreviewComponent value={fromValue} schemaType={schemaType} />
    </DiffAnnotationTooltip>
  ) : (
    undefined
  )

  const to = hasValue(toValue) ? (
    <DiffAnnotationTooltip
      as="ins"
      className={styles.add}
      annotation={annotation}
      style={colorStyle}
    >
      <PreviewComponent value={toValue} schemaType={schemaType} />
    </DiffAnnotationTooltip>
  ) : (
    undefined
  )

  return (
    <div className={containerClassName}>
      <ChangeLayout from={from} to={to} layout={layout} />
    </div>
  )
}

function hasValue(value: unknown) {
  return value !== null && typeof value !== 'undefined' && value !== ''
}
