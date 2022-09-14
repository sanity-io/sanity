import React, {useCallback, useMemo} from 'react'
import {Path, SanityDocument, SlugParent, SlugSchemaType, SlugSourceFn} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {Box, Button, Card, Flex, Stack, TextInput} from '@sanity/ui'
import {PatchEvent, set, setIfMissing, unset} from '../../patch'
import {ObjectInputProps} from '../../types'
import {useFormBuilder} from '../../useFormBuilder'
import {slugify} from './utils/slugify'
import {useAsync} from './utils/useAsync'

export type Slug = {
  _type: 'slug'
  current?: string
}

export type SlugInputProps = ObjectInputProps<Slug, SlugSchemaType>

function getNewFromSource(
  source: string | Path | SlugSourceFn,
  valuePath: Path,
  document: SanityDocument
) {
  const parentPath = valuePath.slice(0, -1)
  const parent = PathUtils.get(document, parentPath) as SlugParent
  return Promise.resolve(
    typeof source === 'function'
      ? source(document, {parentPath, parent})
      : (PathUtils.get(document, source) as string | undefined)
  )
}

export function SlugInput(props: SlugInputProps) {
  const {getDocument} = useFormBuilder().__internal
  const {path, value, schemaType, validation, onChange, onFocusPath, readOnly, elementProps} = props
  const sourceField = schemaType.options?.source
  const errors = useMemo(() => validation.filter((item) => item.level === 'error'), [validation])

  const updateSlug = useCallback(
    (nextSlug: any) => {
      if (!nextSlug) {
        onChange(PatchEvent.from(unset([])))
        return
      }

      onChange(
        PatchEvent.from([setIfMissing({_type: schemaType.name}), set(nextSlug, ['current'])])
      )
    },
    [onChange, schemaType.name]
  )

  const [generateState, handleGenerateSlug] = useAsync(() => {
    if (!sourceField) {
      return Promise.reject(
        new Error(`Source is missing. Check source on type "${schemaType.name}" in schema`)
      )
    }

    return getNewFromSource(
      sourceField,
      path,
      getDocument() || ({_type: schemaType.name} as SanityDocument)
    )
      .then((newFromSource) => slugify(newFromSource || '', schemaType))
      .then((newSlug) => updateSlug(newSlug))
  }, [path, updateSlug, document, schemaType])

  const isUpdating = generateState?.status === 'pending'

  const handleChange = React.useCallback(
    (event: any) => updateSlug(event.currentTarget.value),
    [updateSlug]
  )

  return (
    <Stack space={3}>
      <Flex>
        <Box flex={1}>
          <TextInput
            customValidity={errors.length > 0 ? errors[0].message : ''}
            disabled={isUpdating}
            onChange={handleChange}
            value={value?.current || ''}
            readOnly={readOnly}
            {...elementProps}
          />

          {generateState?.status === 'error' && (
            <Card padding={2} tone="critical">
              {generateState.error.message}
            </Card>
          )}
        </Box>
        {sourceField && (
          <Box marginLeft={1}>
            <Button
              mode="ghost"
              type="button"
              disabled={readOnly || isUpdating}
              onClick={handleGenerateSlug}
              text={generateState?.status === 'pending' ? 'Generating…' : 'Generate'}
            />
          </Box>
        )}
      </Flex>
    </Stack>
  )
}
