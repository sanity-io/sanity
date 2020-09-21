import {Path, SchemaType} from '@sanity/types'
import React, {createElement} from 'react'
import {getChangeVerb, Diff} from '../../diff'
import {PreviewComponent} from '../../preview/types'
import {DiffCard} from './DiffCard'
import {DiffTooltip} from './DiffTooltip'
import {FromTo} from './FromTo'

interface DiffFromToProps {
  cardClassName?: string
  diff: Diff
  layout?: 'grid' | 'inline'
  path?: Path | string
  previewComponent: PreviewComponent<any>
  schemaType: SchemaType
}

export function DiffFromTo(props: DiffFromToProps) {
  const {cardClassName, diff, layout, path, previewComponent, schemaType} = props
  const changeVerb = getChangeVerb(diff)

  return (
    <DiffTooltip description={changeVerb} diff={diff} path={path}>
      <FromTo
        from={
          diff.fromValue !== undefined && diff.fromValue !== null ? (
            <DiffCard className={cardClassName} diff={diff} path={path}>
              <del>{createElement(previewComponent, {schemaType, value: diff.fromValue})}</del>
            </DiffCard>
          ) : (
            undefined
          )
        }
        layout={layout}
        to={
          diff.toValue !== undefined && diff.toValue !== null ? (
            <DiffCard className={cardClassName} diff={diff} path={path}>
              <ins>{createElement(previewComponent, {schemaType, value: diff.toValue})}</ins>
            </DiffCard>
          ) : (
            undefined
          )
        }
      />
    </DiffTooltip>
  )
}
