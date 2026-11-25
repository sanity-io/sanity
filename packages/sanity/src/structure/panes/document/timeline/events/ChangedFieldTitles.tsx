import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {type ObjectSchemaType} from '@sanity/types'
import {Fragment, useMemo} from 'react'
import {getChangedFieldTitles, type ObjectDiff, useTranslation} from 'sanity'
import {Text} from 'ui5'

import {structureLocaleNamespace} from '../../../../i18n'
import {changedFieldTitles, titleSeparator} from './ChangedFieldTitles.css'

const MAX_TITLES = 2

/**
 * A one-line summary of the fields `diff` changes: the first two title paths, and "and more"
 * when there are others.
 */
export function ChangedFieldTitles({
  diff,
  schemaType,
}: {
  diff: ObjectDiff
  schemaType: ObjectSchemaType
}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const titles = useMemo(() => getChangedFieldTitles(schemaType, diff), [schemaType, diff])

  if (titles.length === 0) return null
  return (
    <Text
      as="div"
      className={changedFieldTitles}
      data-testid="changed-field-titles"
      size={0}
      title={titles.map((title) => title.join(' › ')).join(', ')}
      trim={true}
      truncate={1}
      weight="medium"
    >
      {titles.slice(0, MAX_TITLES).map((title, titleIndex) => (
        <Fragment key={JSON.stringify(title)}>
          {titleIndex > 0 && ', '}
          {title.map((segment, segmentIndex) => (
            // oxlint-disable-next-line no-array-index-key -- a title path's segments don't move
            <Fragment key={segmentIndex}>
              {segmentIndex > 0 && <ChevronRightIcon className={titleSeparator} />}
              {segment}
            </Fragment>
          ))}
        </Fragment>
      ))}
      {titles.length > MAX_TITLES && `, ${t('timeline-item.changed-fields.and-more')}`}
    </Text>
  )
}
