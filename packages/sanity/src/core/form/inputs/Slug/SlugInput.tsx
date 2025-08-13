import {
  type Path,
  type SanityDocument,
  type SlugParent,
  type SlugSchemaType,
  type SlugSourceContext,
  type SlugSourceFn,
  type SlugValue,
} from '@sanity/types'
import {Box, Card, Flex, Stack, TextInput} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {type FormEvent, useCallback, useImperativeHandle, useMemo, useRef} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useGetFormValue} from '../../contexts/GetFormValue'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {PatchEvent} from '../../patch/PatchEvent'
import {set, setIfMissing, unset} from '../../patch/patch'
import type {ObjectInputProps} from '../../types/inputProps'
import {slugify} from './utils/slugify'
import {useAsync} from './utils/useAsync'
import {type SlugContext, useSlugContext} from './utils/useSlugContext'

/**
 *
 * @hidden
 * @beta
 */
export type SlugInputProps = ObjectInputProps<SlugValue, SlugSchemaType>

function getSlugSourceContext(
  valuePath: Path,
  document: SanityDocument,
  context: SlugContext,
): SlugSourceContext {
  const parentPath = valuePath.slice(0, -1)
  const parent = PathUtils.get(document, parentPath) as SlugParent
  return {parentPath, parent, ...context}
}

async function getNewFromSource(
  source: string | Path | SlugSourceFn,
  document: SanityDocument,
  context: SlugSourceContext,
): Promise<string | undefined> {
  return typeof source === 'function'
    ? source(document, context)
    : (PathUtils.get(document, source) as string | undefined)
}

/**
 *
 * @hidden
 * @beta
 */
export function SlugInput(props: SlugInputProps) {
  const getFormValue = useGetFormValue()
  const {
    path,
    value,
    schemaType,
    validation,
    onChange,
    readOnly,
    elementProps,
    focused,
    focusPath,
  } = props
  const sourceField = schemaType.options?.source
  const errors = useMemo(() => validation.filter((item) => item.level === 'error'), [validation])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const slugContext = useSlugContext()

  const {t} = useTranslation()

  const updateSlug = useCallback(
    (nextSlug: string) => {
      if (!nextSlug) {
        onChange(PatchEvent.from(unset([])))
        return
      }

      onChange(
        PatchEvent.from([setIfMissing({_type: schemaType.name}), set(nextSlug, ['current'])]),
      )
    },
    [onChange, schemaType.name],
  )

  const handleAsyncGenerateSlug = useCallback(() => {
    if (!sourceField) {
      return Promise.reject(
        new Error(t('inputs.slug.error.missing-source', {schemaType: schemaType.name})),
      )
    }

    const doc = (getFormValue([]) as SanityDocument) || ({_type: schemaType.name} as SanityDocument)
    const sourceContext = getSlugSourceContext(path, doc, slugContext)
    return getNewFromSource(sourceField, doc, sourceContext)
      .then((newFromSource) => slugify(newFromSource || '', schemaType, sourceContext))
      .then((newSlug) => updateSlug(newSlug))
  }, [sourceField, getFormValue, schemaType, path, slugContext, updateSlug, t])
  const [generateState, handleGenerateSlug] = useAsync(handleAsyncGenerateSlug)

  const isUpdating = generateState?.status === 'pending'

  const handleChange = useCallback(
    (event: FormEvent<HTMLInputElement>) => updateSlug(event.currentTarget.value),
    [updateSlug],
  )

  const handleFocus = useCallback(() => {
    // Use requestAnimationFrame to defer focus to next frame, preventing race conditions
    // this is especially important for blur/focus handlers in array contexts
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  // Make sure the slug input is focused when the `focused` prop becomes true, regardless of wether the focusPath is `slug` or `slug.current` (both should work)
  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      handleFocus()
    }
  })
  // Handle stega visual editing links, which uses `slug.current` as the focus path
  useDidUpdate(focusPath, (prevFocusPath = [], currentFocusPath) => {
    // It's an array in both cases, we care only about a transition from `[]` to `['current']`, not `['current']` to `['current']` so we have to deep equal the array
    if (
      prevFocusPath !== currentFocusPath &&
      Array.isArray(prevFocusPath) &&
      Array.isArray(currentFocusPath) &&
      prevFocusPath.length === 0 &&
      currentFocusPath.length === 1 &&
      currentFocusPath[0] === 'current'
    ) {
      handleFocus()
    }
  })

  // Merge the elementProps.ref with our local ref, so that parent callers still have access to the node after we added the local ref
  useImperativeHandle(elementProps.ref, () => inputRef.current)

  return (
    <Stack space={3}>
      <Flex gap={1}>
        <Box flex={1}>
          <TextInput
            customValidity={errors.length > 0 ? errors[0].message : ''}
            disabled={isUpdating}
            onChange={handleChange}
            value={value?.current || ''}
            readOnly={readOnly}
            {...elementProps}
            ref={inputRef}
          />

          {generateState?.status === 'error' && (
            <Card padding={2} tone="critical">
              {generateState.error.message}
            </Card>
          )}
        </Box>
        {sourceField && (
          <Button
            mode="ghost"
            type="button"
            disabled={readOnly || isUpdating}
            onClick={handleGenerateSlug}
            size="large"
            text={
              generateState?.status === 'pending'
                ? t('inputs.slug.action.generating')
                : t('inputs.slug.action.generate')
            }
          />
        )}
      </Flex>
    </Stack>
  )
}
