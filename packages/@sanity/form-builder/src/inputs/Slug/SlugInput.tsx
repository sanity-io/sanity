import React from 'react'
import {
  Path,
  SanityDocument,
  SlugParent,
  SlugSchemaType,
  Marker,
  isValidationErrorMarker,
} from '@sanity/types'
import {ChangeIndicatorCompareValueProvider} from '@sanity/base/lib/change-indicators/ChangeIndicator'
import * as PathUtils from '@sanity/util/paths'
import {TextInput, Button, Flex, Box, Card, Stack, Badge} from '@sanity/ui'

import FormField from 'part:@sanity/components/formfields/default'
import {useId} from '@reach/auto-id'
import {PatchEvent, set, setIfMissing, unset} from '../../PatchEvent'
import withDocument from '../../utils/withDocument'
import withValuePath from '../../utils/withValuePath'
import {slugify} from './utils/slugify'
import {useAsyncCallback} from './utils/useAsync'

interface Slug {
  _type: 'slug'
  current?: string
}

type Props = {
  type: SlugSchemaType
  level: number
  value?: Slug
  compareValue?: Slug
  readOnly?: boolean
  document: SanityDocument
  onChange: (ev: PatchEvent) => void
  getValuePath: () => Path
  markers: Marker[]
  presence: any
}

function getNewFromSource(source, valuePath, document) {
  const parentPath = valuePath.slice(0, -1)
  const parent = PathUtils.get(document, parentPath) as SlugParent
  return Promise.resolve(
    typeof source === 'function'
      ? source(document, {parentPath, parent})
      : (PathUtils.get(document, source) as string | undefined)
  )
}

const SlugInput = React.forwardRef(function SlugInput(
  props: Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {
    value,
    compareValue,
    type,
    level,
    markers,
    onChange,
    getValuePath,
    document,
    readOnly,
    presence,
  } = props

  const sourceField = type.options?.source

  const inputId = useId()
  const errors = markers.filter(isValidationErrorMarker)

  const updateSlug = React.useCallback(
    (nextSlug) => {
      if (!nextSlug) {
        onChange(PatchEvent.from(unset([])))
        return
      }

      onChange(PatchEvent.from(setIfMissing({_type: type.name}), set(nextSlug, ['current'])))
    },
    [onChange, type.name]
  )

  const [generateState, handleGenerateSlug] = useAsyncCallback(() => {
    if (!sourceField) {
      return Promise.reject(
        new Error(`Source is missing. Check source on type "${type.name}" in schema`)
      )
    }

    return getNewFromSource(sourceField, getValuePath(), document)
      .then((newFromSource) => slugify(newFromSource || '', type))
      .then((newSlug) => updateSlug(newSlug))
  }, [getValuePath, updateSlug, document, type])

  const isUpdating = generateState?.status === 'pending'

  return (
    <ChangeIndicatorCompareValueProvider
      value={value?.current}
      compareValue={compareValue?.current}
    >
      <FormField
        label={type.title}
        description={type.description}
        level={level}
        markers={markers}
        presence={presence}
        labelFor={inputId}
      >
        <Stack space={3}>
          <Flex>
            <Box flex={1}>
              <TextInput
                id={inputId}
                ref={forwardedRef}
                customValidity={errors.length > 0 ? errors[0].item.message : ''}
                disabled={isUpdating}
                onChange={React.useCallback((event) => updateSlug(event.currentTarget.value), [
                  updateSlug,
                ])}
                value={value?.current || ''}
                readOnly={readOnly}
              />
              {generateState?.status === 'error' && (
                <Card padding={2} tone="critical">
                  {generateState.error.message}
                </Card>
              )}
            </Box>
            <Box marginLeft={1}>
              <Button
                mode="ghost"
                type="button"
                disabled={readOnly || isUpdating}
                onClick={handleGenerateSlug}
              >
                {generateState?.status === 'pending' ? 'Generating…' : 'Generate'}
              </Button>
            </Box>
          </Flex>
        </Stack>
      </FormField>
    </ChangeIndicatorCompareValueProvider>
  )
})

export default withValuePath(withDocument(SlugInput))
