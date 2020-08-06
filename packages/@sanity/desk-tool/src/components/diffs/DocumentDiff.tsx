import * as React from 'react'
import {ObjectDiff} from '@sanity/diff'
import {Annotation} from '../../panes/documentPane/history/types'
import styles from './DocumentDiff.css'
import {DiffComponent} from './types'
import {FieldDiff} from './FieldDiff'

export const DocumentDiff: DiffComponent<ObjectDiff<Annotation>> = function DocumentDiff({
  schemaType,
  fields
}) {
  if (!schemaType.fields) {
    console.warn('Invalid schema type passed to document diff, no `fields` present')
    return null
  }

  return (
    <div className={styles.diffCardList}>
      {schemaType.fields.map(field => {
        const fieldDiff = fields[field.name]
        if (!fieldDiff || !fieldDiff.isChanged || fieldDiff.type !== 'changed') {
          return null
        }

        return <FieldDiff key={field.name} schemaType={field.type} {...fieldDiff.diff} />
        /*
        return (
          <FieldDiffProvider key={field.name} field={field} diff={fieldDiff}>
            <FieldDiff schemaType={field.type} {...fieldDiff} />
          </FieldDiffProvider>
        )
        */
      })}
    </div>
  )
}
