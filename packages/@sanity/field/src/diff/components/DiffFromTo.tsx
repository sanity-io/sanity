import classNames from 'classnames'
import {Path, SchemaType} from '@sanity/types'
import React, {createElement} from 'react'
import {getChangeVerb, Diff} from '../../diff'
import {PreviewComponent} from '../../preview/types'
import {DiffCard} from './DiffCard'
import {DiffTooltip} from './DiffTooltip'
import {FromTo} from './FromTo'

import styles from './DiffFromTo.css'

interface DiffFromToProps {
  align?: 'top' | 'center' | 'bottom'
  cardClassName?: string
  diff: Diff
  layout?: 'grid' | 'inline'
  path?: Path | string
  previewComponent: PreviewComponent<any>
  schemaType: SchemaType
}

export function DiffFromTo(props: DiffFromToProps) {
  const {align, cardClassName, diff, layout, path, previewComponent, schemaType} = props
  const {action} = diff
  const changeVerb = getChangeVerb(diff)

  if (action === 'unchanged') {
    return (
      <DiffCard className={classNames(styles.card, cardClassName)}>
        {createElement(previewComponent, {schemaType, value: diff.toValue})}
      </DiffCard>
    )
  }

  const from = diff.fromValue !== undefined && diff.fromValue !== null && (
    <DiffCard as="del" className={classNames(styles.card, cardClassName)} diff={diff} path={path}>
      {createElement(previewComponent, {schemaType, value: diff.fromValue})}
    </DiffCard>
  )

  const to = diff.toValue !== undefined && diff.toValue !== null && (
    <DiffCard as="ins" className={classNames(styles.card, cardClassName)} diff={diff} path={path}>
      {createElement(previewComponent, {schemaType, value: diff.toValue})}
    </DiffCard>
  )

  if (from && !to) {
    return (
      <DiffTooltip description={changeVerb} diff={diff} path={path}>
        {from}
      </DiffTooltip>
    )
  }

  if (!from && to) {
    return (
      <DiffTooltip description={changeVerb} diff={diff} path={path}>
        {to}
      </DiffTooltip>
    )
  }

  return (
    <DiffTooltip description={changeVerb} diff={diff} path={path}>
      <FromTo align={align} from={from} layout={layout} to={to} />
    </DiffTooltip>
  )
}
