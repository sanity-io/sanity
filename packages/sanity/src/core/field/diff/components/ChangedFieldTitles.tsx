import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {type ObjectSchemaType} from '@sanity/types'
import {Fragment, useMemo} from 'react'
import {Text} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type ObjectDiff} from '../../types'
import {buildObjectChangeList} from '../changes/buildChangeList'
import {flattenChangeNode} from '../changes/helpers'
import {changedFieldTitles, titleSeparator} from './ChangedFieldTitles.css'

const MAX_TITLES = 2

/**
 * The title paths of the fields `diff` changes, the way the change list heads them (`#n` for an
 * array item), each listed once.
 */
function getChangedFieldTitles(schemaType: ObjectSchemaType, diff: ObjectDiff): string[][] {
  const seen = new Set<string>()
  const titles: string[][] = []
  for (const change of buildObjectChangeList(schemaType, diff, [], []).flatMap(flattenChangeNode)) {
    if (change.hidden === true) continue
    const title = change.titlePath.flatMap((segment) => {
      if (typeof segment === 'string') return [segment]
      return change.showIndex ? [`#${(segment.toIndex ?? segment.fromIndex ?? 0) + 1}`] : []
    })
    const key = JSON.stringify(title)
    if (title.length === 0 || seen.has(key)) continue
    seen.add(key)
    titles.push(title)
  }
  return titles
}

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
  const {t} = useTranslation()
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
      {titles.length > MAX_TITLES && `, ${t('changes.changed-fields.and-more')}`}
    </Text>
  )
}
