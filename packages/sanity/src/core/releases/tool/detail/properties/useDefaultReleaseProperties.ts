import {type ObjectField} from '@sanity/types'
import {useEffect, useMemo} from 'react'

import {
  type ReleasePropertyComponent,
  type ReleasePropertyDescription,
  type ReleasePropertyProps,
} from '../../../../config/releases/properties'
import {resolveConditionalProperty} from '../../../../form/store/conditional-property/resolveConditionalProperty'
import {useDateTimeFormat} from '../../../../hooks/useDateTimeFormat'
import {useNumberFormat} from '../../../../hooks/useNumberFormat'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useCurrentUser} from '../../../../store/user/hooks'
import {releasesLocaleNamespace} from '../../../i18n'
import {formValueFromMetadata} from '../../../metadata/formValueFromMetadata'
import {useReleaseMetadataSchemaType} from '../../../metadata/useReleaseMetadataSchemaType'
import {formatMetadataValue, hasMetadataRow, type MetadataFormatters} from './formatMetadataValue'
import {warnOncePerProperty} from './warnOncePerProperty'

function useMetadataFormatters(): MetadataFormatters {
  const {t} = useTranslation(releasesLocaleNamespace)
  return {
    number: useNumberFormat(),
    date: useDateTimeFormat({dateStyle: 'medium', timeZone: 'UTC'}),
    datetime: useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'}),
    yes: t('dashboard.details.metadata.boolean-true'),
    no: t('dashboard.details.metadata.boolean-false'),
  }
}

function fieldTitle(field: ObjectField): string {
  return field.type.title || field.name
}

function createMetadataFieldProperty(
  field: ObjectField,
  fieldNames: readonly string[],
): ReleasePropertyComponent {
  function MetadataFieldProperty({
    release,
  }: ReleasePropertyProps): ReleasePropertyDescription | null {
    const formatters = useMetadataFormatters()
    const currentUser = useCurrentUser()
    // `hidden` reads the same flat document the edit form gives it, never the release document.
    const document = formValueFromMetadata(release.metadata, fieldNames)
    const value = document[field.name]
    const hidden = resolveConditionalProperty(field.type.hidden, {
      document,
      parent: document,
      value,
      currentUser,
      path: [field.name],
    })
    const formatted = hidden
      ? undefined
      : formatMetadataValue({
          type: field.type,
          value,
          formatters,
          isFieldHidden: (nested, parent) =>
            resolveConditionalProperty(nested.type.hidden, {
              document,
              parent,
              value: parent[nested.name],
              currentUser,
              path: [field.name, nested.name],
            }),
        })
    const unsupportedReason = formatted?.status === 'unsupported' ? formatted.reason : undefined

    useEffect(() => {
      if (unsupportedReason) {
        warnOncePerProperty(
          MetadataFieldProperty,
          `No row for metadata field "${field.name}": ${unsupportedReason}`,
        )
      }
    }, [unsupportedReason])

    if (formatted === undefined || formatted.status === 'unsupported') return null

    const label = fieldTitle(field)
    if (formatted.status === 'empty') return {label, value: ''}
    return formatted.href
      ? {label, value: formatted.text, href: formatted.href}
      : {label, value: formatted.text}
  }

  return Object.assign(MetadataFieldProperty, {field: field.name})
}

export interface DefaultReleaseProperties {
  properties: ReleasePropertyComponent[]
  fieldTitles: ReadonlyMap<string, string>
}

/**
 * Studio's default release properties: one row per configured metadata field that can show a value, in field order.
 * The components keep their identity while the compiled metadata type does, since the property
 * collector keys each row by component.
 */
export function useDefaultReleaseProperties(): DefaultReleaseProperties {
  const compiled = useReleaseMetadataSchemaType()

  return useMemo(() => {
    const fields = compiled?.schemaType.fields ?? []
    const fieldNames = fields.map((field) => field.name)
    const rowFields = fields.filter((field) => hasMetadataRow(field.type))
    return {
      properties: rowFields.map((field) => createMetadataFieldProperty(field, fieldNames)),
      fieldTitles: new Map(rowFields.map((field) => [field.name, fieldTitle(field)])),
    }
  }, [compiled])
}
