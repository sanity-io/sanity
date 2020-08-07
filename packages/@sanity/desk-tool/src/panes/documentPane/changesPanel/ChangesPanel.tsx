/* eslint-disable max-depth */
import React, {Fragment} from 'react'
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
      <header className={styles.header}>
        <h2>Changes</h2>
      </header>

      <div style={{padding: '1em'}}>
        <div className={styles.changeList}>
          {changes.map(change => (
            <ChangeResolver change={change} key={change.key} level={0} />
          ))}
        </div>
      </div>
    </div>
  )
}

function FieldChange({change, level = 0}: {change: FieldChangeNode; level: number}) {
  const DiffComponent = resolveDiffComponent(change.schemaType) || FallbackDiff
  return (
    <div className={styles.fieldChange}>
      <div className={styles.change__header}>
        <div className={styles.change__breadcrumb}>
          {change.titlePath.slice(level).map((titleSegment, idx) => {
            return (
              <Fragment key={idx}>
                {idx > 0 && <> › </>}
                <strong>{titleSegment}</strong>
              </Fragment>
            )
          })}
        </div>

        <button className={styles.change__revertButton}>Revert changes</button>
      </div>

      <DiffComponent diff={change.diff} schemaType={change.schemaType} />
    </div>
  )
}

function GroupChange({change: group}: {change: GroupChangeNode; level: number}) {
  const {titlePath, changes} = group
  return (
    <div className={styles.groupChange}>
      <div className={styles.change__header}>
        <div className={styles.change__breadcrumb}>
          {titlePath.map((titleSegment, idx) => {
            return (
              <Fragment key={idx}>
                {idx > 0 && <> › </>}
                <strong>{titleSegment}</strong>
              </Fragment>
            )
          })}
        </div>

        <button className={styles.change__revertButton}>Revert changes</button>
      </div>

      <div className={styles.changeList}>
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
