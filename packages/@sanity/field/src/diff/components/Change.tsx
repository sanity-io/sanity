import React from 'react'
import {Path} from '../../paths'
import {PreviewComponent} from '../../preview/types'
import {DiffAnnotationTooltip, DiffAnnotationCard} from '../annotations'
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
  className,
  schemaType,
  previewComponent: PreviewComponent
}: ChangeProps) {
  const containerClassName = className ? `${styles.root} ${className}` : styles.root
  const {fromValue, toValue} = diff
  const from = hasValue(fromValue) ? (
    <DiffAnnotationCard as="del" className={styles.remove} diff={diff}>
      <PreviewComponent value={fromValue} schemaType={schemaType} />
    </DiffAnnotationCard>
  ) : (
    undefined
  )

  const to = hasValue(toValue) ? (
    <DiffAnnotationCard as="ins" className={styles.add} diff={diff}>
      <PreviewComponent value={toValue} schemaType={schemaType} />
    </DiffAnnotationCard>
  ) : (
    undefined
  )

  return (
    <DiffAnnotationTooltip className={containerClassName} diff={diff}>
      <ChangeLayout from={from} to={to} layout={layout} />
    </DiffAnnotationTooltip>
  )
}

function hasValue(value: unknown) {
  return value !== null && typeof value !== 'undefined' && value !== ''
}
