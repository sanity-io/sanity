import {isPlainObject} from 'lodash'
import React, {useCallback, useMemo} from 'react'
import {FormPatch, PatchEvent, ValidationMarker, set, setIfMissing, useClient} from 'sanity'
import {Box} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}

export interface LinkAnnotationInputProps {
  value: unknown
  type: {name: string; fields: {name: string; type: {title: string; options?: any}}[]}
  onChange: (event: any) => void
  onFocus: (path: any) => void
  onBlur: () => void
  validation: ValidationMarker[]
}

interface PartialPatchEvent {
  patches: FormPatch[]
}

interface SlugQueryResult {
  uniqueSlug: {
    current: string
  }
}

export const LinkAnnotationInput = (props: LinkAnnotationInputProps) => {
  const {type, value, onChange, onBlur, onFocus, validation} = props
  const client = useClient({apiVersion: '2022-09-09'})
  const versionedClient = useMemo(() => client.withConfig({apiVersion: '2021-03-01'}), [client])
  const referenceArticleField = type.fields.find((field) => field.name === 'reference')
  const urlField = type.fields.find((field) => field.name === 'href')
  const urlFieldDisabled =
    isRecord(value) &&
    referenceArticleField?.name &&
    value[referenceArticleField?.name] !== undefined
  const exclude = [urlField?.name, referenceArticleField?.name]
  const otherFields = type.fields.filter((f) => !exclude.includes(f.name))
  const getFieldValidation = useCallback(
    (fieldName: any) =>
      validation.filter((marker) => PathUtils.startsWith([fieldName], marker.path)),
    [validation],
  )
  const handleFieldChange = useCallback(
    (field: any, fieldPatchEvent: any) => {
      const patchEvent = fieldPatchEvent
        .prefixAll(field.name)
        .prepend(setIfMissing({_type: type.name}))
      onChange(patchEvent)
    },
    [onChange, type],
  )
  const handleReferenceChange = useCallback(
    async (patchEvent: PartialPatchEvent) => {
      handleFieldChange(referenceArticleField, patchEvent)
      const setPatch = patchEvent.patches.find((patch) => patch.type === 'set')
      if (setPatch) {
        const params = {
          ID: (setPatch as any).value as string,
        }
        const query = `
        *[
          _type == "book" &&
          _id == $ID &&
          !(_id in path("drafts.**"))
        ]
        {
          uniqueSlug
        }
        [0]
      `
        const result = (await versionedClient.fetch(query, params)) as SlugQueryResult

        if (result) {
          const event = PatchEvent.from(set(result?.uniqueSlug?.current, ['href']))
          onChange(event)
        }
      }
    },
    [handleFieldChange, onChange, referenceArticleField, versionedClient],
  )

  return (
    <>
      <Box flex={1} paddingY={2}>
        TODO
        {/* <FormBuilderInput
          key={referenceArticleField?.name}
          level={0}
          type={referenceArticleField?.type as any}
          value={
            (isRecord(value) &&
              referenceArticleField?.name &&
              value[referenceArticleField?.name]) ||
            undefined
          }
          onChange={handleReferenceChange as any}
          onBlur={onBlur}
          onFocus={onFocus}
          focusPath={[referenceArticleField?.name as any, '_ref']}
          path={[referenceArticleField?.name as any]}
          filterField={referenceArticleField?.type?.options?.filter}
          presence={[]}
          validation={[]}
        /> */}
      </Box>
      <Box flex={1} paddingY={2}>
        TODO
        {/* <FormBuilderInput
          level={0}
          key={urlField?.name}
          type={urlField?.type as any}
          value={(isRecord(value) && urlField?.name && value[urlField?.name]) || undefined}
          onChange={
            ((patchEvent: PartialPatchEvent) => handleFieldChange(urlField, patchEvent)) as any
          }
          onBlur={onBlur}
          onFocus={onFocus}
          focusPath={[urlField?.name as any]}
          path={[urlField?.name as any]}
          filterField={urlField?.type?.options?.filter}
          readOnly={urlFieldDisabled || false}
          presence={[]}
          validation={getFieldValidation(urlField?.name)}
        /> */}
      </Box>
      {otherFields.map((field) => (
        <Box flex={1} key={field?.name} paddingY={2}>
          TODO
          {/* <FormBuilderInput
            type={field?.type as any}
            value={(isRecord(value) && field?.name && value[field?.name]) || undefined}
            onChange={
              ((patchEvent: PartialPatchEvent) => handleFieldChange(field, patchEvent)) as any
            }
            onBlur={onBlur}
            onFocus={onFocus}
            focusPath={[field?.name]}
            path={[field?.name]}
            filterField={field?.type?.options?.filter}
            level={0}
            presence={[]}
            validation={getFieldValidation(field?.name)}
          /> */}
        </Box>
      ))}
    </>
  )
}
