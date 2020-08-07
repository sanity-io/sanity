/* eslint-disable max-depth */
import React from 'react'
import {Diff, NoDiff} from '@sanity/diff'
import {FallbackDiff} from '../../../components/diffs/FallbackDiff'
import {resolveDiffComponent} from '../../../components/diffs/resolveDiffComponent'
import {Annotation} from '../history/types'
import {SchemaType, ChangeNode, FieldChangeNode, GroupChangeNode} from '../types'
import {buildChangeList} from './buildChangeList'
import styles from './ChangesPanel.css'

type Props = {
  diff: Diff<Annotation> | NoDiff | null
  schemaType: SchemaType
}

export function ChangesPanel({diff, schemaType}: Props) {
  if (!diff || diff.type !== 'object') {
    return null
  }

  const changes = buildChangeList(schemaType, diff, [], [])
  return (
    <div className={styles.root}>
      <h2>Changes</h2>

      <div style={{display: 'grid', gridGap: '2em'}}>
        {changes.map(change => (
          <ChangeResolver change={change} key={change.key} level={0} />
        ))}
      </div>
    </div>
  )
}

function FieldChange({change, level = 0}: {change: FieldChangeNode; level: number}) {
  const DiffComponent = resolveDiffComponent(change.schemaType) || FallbackDiff
  return (
    <div>
      <div>
        {change.titlePath.slice(level).map((titleSegment, idx) => {
          return (
            <>
              {idx > 0 && <> › </>}
              <strong>{titleSegment}</strong>
            </>
          )
        })}
      </div>

      <DiffComponent diff={change.diff} schemaType={change.schemaType} />
    </div>
  )
}

function GroupChange({change: group}: {change: GroupChangeNode; level: number}) {
  const {titlePath, changes} = group
  return (
    <div>
      <div>
        {titlePath.map((titleSegment, idx) => {
          return (
            <>
              {idx > 0 && <> › </>}
              <strong>{titleSegment}</strong>
            </>
          )
        })}
      </div>
      <div
        style={{
          display: 'grid',
          gridGap: '2em',
          borderLeft: '1px solid #ccc',
          paddingLeft: '0.75em'
        }}
      >
        {changes.map(change => {
          return (
            <ChangeResolver change={change} key={change.key} level={change.titlePath.length - 1} />
          )
        })}
      </div>
    </div>
  )
}

function ChangeResolver({change, level = 0}: {change: ChangeNode; level: number}) {
  return change.type === 'field' ? (
    <FieldChange change={change} level={level} />
  ) : (
    <GroupChange change={change} level={level} />
  )
}
