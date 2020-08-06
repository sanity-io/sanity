/* eslint-disable max-depth */
import React from 'react'
import {toString as pathToString} from '@sanity/util/paths'
import {Diff, NoDiff, ObjectDiff, Path, FieldDiff} from '@sanity/diff'
import {FallbackDiff} from '../../../components/diffs/FallbackDiff'
import {resolveDiffComponent} from '../../../components/diffs/resolveDiffComponent'
import {Annotation} from '../history/types'
import {SchemaType, ChangeNode, FieldChangeNode, GroupChangeNode} from '../types'
import styles from './ChangesPanel.css'

type Props = {
  diff: Diff<Annotation> | NoDiff | null
  schemaType: SchemaType
}

function getDiffAtPath(diff: ObjectDiff<Annotation>, path: Path): Diff<Annotation> | null {
  let node: Diff<Annotation> = diff

  for (const segment of path) {
    if (node.type === 'object' && typeof segment === 'string') {
      const fieldDiff: FieldDiff<Annotation> = node.fields[segment]
      if (!fieldDiff || fieldDiff.type === 'unchanged') {
        return null
      }

      if (fieldDiff.type === 'added' || fieldDiff.type === 'removed') {
        // @todo how do we want to handle this?
        return null
      }

      node = fieldDiff.diff
    } else {
      throw new Error(
        `Mismatch between path segment (${typeof segment}) and diff type (${diff.type})`
      )
    }
  }

  return node
}

function buildChangeList(
  schemaType: SchemaType,
  diff: ObjectDiff<Annotation>,
  path: Path,
  titlePath: string[]
): ChangeNode[] {
  const list: ChangeNode[] = []

  const diffComponent = resolveDiffComponent(schemaType)
  if (diffComponent) {
    const fieldDiff = getDiffAtPath(diff, path)
    if (fieldDiff) {
      list.push({
        type: 'field',
        diff: fieldDiff,
        key: pathToString(path),
        path,
        titlePath,
        schemaType
      })
    }
  } else {
    schemaType.fields.forEach(field => {
      const fieldPath = path.concat([field.name])
      const fieldTitlePath = titlePath.concat([field.type.title || field.name])
      if (field.type.jsonType === 'object') {
        const objectChanges = buildChangeList(field.type, diff, fieldPath, fieldTitlePath)
        if (objectChanges.length > 1) {
          list.push({
            type: 'group',
            key: pathToString(fieldPath),
            path: fieldPath,
            titlePath: fieldTitlePath,
            changes: objectChanges
          })
        } else {
          list.push(...objectChanges)
        }
      } else {
        const fieldDiff = getDiffAtPath(diff, fieldPath)
        if (fieldDiff) {
          list.push({
            type: 'field',
            diff: fieldDiff,
            key: fieldPath.join('.'),
            path: fieldPath,
            titlePath: fieldTitlePath,
            schemaType: field.type
          })
        }
      }
    })
  }

  return list
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
