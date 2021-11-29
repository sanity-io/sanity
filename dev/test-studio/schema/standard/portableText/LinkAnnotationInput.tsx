import {isPlainObject} from 'lodash'
import React, {useCallback} from 'react'
import {FormBuilderInput} from 'part:@sanity/form-builder'
import {PatchEvent, set, setIfMissing} from 'part:@sanity/form-builder/patch-event'
import sanityClient from 'part:@sanity/base/client'
import {Box} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'

const client = sanityClient.withConfig({apiVersion: '2021-03-01'})

export function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}

export interface LinkAnnotationInputProps {
  value: unknown
  type: {name: string; fields: {name: string; type: {title: string; options?: any}}[]}
  onChange: (event: any) => void
  onFocus: (path: any) => void
  onBlur: () => void
  markers: any[]
}

// PatchEvent type can be found packages/@sanity/form-builder/src/PatchEvent.ts
// It's a class thats imported via part: which looses typings 'part:@sanity/form-builder/patch-event'
// It's quite a large complex type, emulating the useful structure here
interface Patch {
  path: any[]
  type: 'set' | 'unset' | 'setIfMissing' | 'dec' | 'inc' | 'diffMatchPatch'
  value: unknown
}

interface PartialPatchEvent {
  patches: Patch[]
}

interface SlugQueryResult {
  uniqueSlug: {
    current: string
  }
}

export const LinkAnnotationInput = (props: LinkAnnotationInputProps) => {
  const {type, value, onChange, onBlur, onFocus, markers} = props
  const referenceArticleField = type.fields.find((field) => field.name === 'reference')
  const urlField = type.fields.find((field) => field.name === 'href')
  const urlFieldDisabled =
    isRecord(value) &&
    referenceArticleField?.name &&
    value[referenceArticleField?.name] !== undefined
  const exclude = [urlField?.name, referenceArticleField?.name]
  const otherFields = type.fields.filter((f) => !exclude.includes(f.name))
  const getFieldMarkers = useCallback(
    (fieldName) => {
      return markers.filter((marker) => PathUtils.startsWith([fieldName], marker.path))
    },
    [markers]
  )
  const handleFieldChange = useCallback(
    (field, fieldPatchEvent) => {
      const patchEvent = fieldPatchEvent
        .prefixAll(field.name)
        .prepend(setIfMissing({_type: type.name}))
      onChange(patchEvent)
    },
    [onChange, type]
  )
  const handleReferenceChange = useCallback(
    async (patchEvent: PartialPatchEvent) => {
      handleFieldChange(referenceArticleField, patchEvent)
      const setPatch = patchEvent.patches.find((patch) => patch.type === 'set')
      if (setPatch) {
        const params = {
          ID: setPatch.value as string,
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
        const result = (await client.fetch(query, params)) as SlugQueryResult

        if (result) {
          const event = PatchEvent.from(set(result?.uniqueSlug?.current, ['href']))
          onChange(event)
        }
      }
    },
    [handleFieldChange, onChange, referenceArticleField]
  )
  return (
    <>
      <Box flex={1} paddingY={2}>
        <FormBuilderInput
          key={referenceArticleField?.name}
          type={referenceArticleField?.type}
          value={
            (isRecord(value) &&
              referenceArticleField?.name &&
              value[referenceArticleField?.name]) ||
            undefined
          }
          onChange={handleReferenceChange}
          onBlur={onBlur}
          onFocus={onFocus}
          focusPath={[referenceArticleField?.name, '_ref']}
          path={[referenceArticleField?.name]}
          filterField={referenceArticleField?.type?.options?.filter}
        />
      </Box>
      <Box flex={1} paddingY={2}>
        <FormBuilderInput
          key={urlField?.name}
          type={urlField?.type}
          value={(isRecord(value) && urlField?.name && value[urlField?.name]) || undefined}
          onChange={(patchEvent: PartialPatchEvent) => handleFieldChange(urlField, patchEvent)}
          onBlur={onBlur}
          onFocus={onFocus}
          focusPath={[urlField?.name]}
          path={[urlField?.name]}
          filterField={urlField?.type?.options?.filter}
          readOnly={urlFieldDisabled}
          markers={getFieldMarkers(urlField?.name)}
        />
      </Box>
      {otherFields.map((field) => (
        <Box flex={1} key={field?.name} paddingY={2}>
          <FormBuilderInput
            type={field?.type}
            value={(isRecord(value) && field?.name && value[field?.name]) || undefined}
            onChange={(patchEvent: PartialPatchEvent) => handleFieldChange(field, patchEvent)}
            onBlur={onBlur}
            onFocus={onFocus}
            focusPath={[field?.name]}
            path={[field?.name]}
            filterField={field?.type?.options?.filter}
            markers={getFieldMarkers(field?.name)}
          />
        </Box>
      ))}
    </>
  )
}
