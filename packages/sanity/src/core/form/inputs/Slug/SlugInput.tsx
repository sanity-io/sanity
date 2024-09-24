import {
  type Path,
  type SanityDocument,
  type SlugParent,
  type SlugSchemaType,
  type SlugSourceContext,
  type SlugSourceFn,
  type SlugValue,
} from '@sanity/types'
import {Box, Card, Code, Flex, Stack, TextInput} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {uuid} from '@sanity/uuid'
import {type FormEvent, useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {getPublishedId, useDocumentStore, useFormValue} from 'sanity'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useGetFormValue} from '../../contexts/GetFormValue'
import {PatchEvent, set, setIfMissing, unset} from '../../patch'
import {type ObjectInputProps} from '../../types'
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

// eslint-disable-next-line require-await
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
  const formValue = useFormValue([]) as SanityDocument
  const documentStore = useDocumentStore()
  const id = getPublishedId(formValue._id)
  const type = formValue._type
  const observable = useMemo(
    () => documentStore.pair.editState(id, type),
    [documentStore.pair, id, type],
  )
  const {published} = useObservable(observable)!
  // @ts-expect-error fix this
  const publishedSlug = published?.slug?.current as string | undefined

  const getFormValue = useGetFormValue()
  const {path, value, schemaType, validation, onChange, readOnly, elementProps} = props
  const sourceField = schemaType.options?.source
  const errors = useMemo(() => validation.filter((item) => item.level === 'error'), [validation])

  const slugContext = useSlugContext()

  const {t} = useTranslation()

  const updateSlug = useCallback(
    (nextSlug: string) => {
      if (!nextSlug) {
        onChange(PatchEvent.from(unset(['current'])))
        return
      }

      onChange(
        PatchEvent.from([setIfMissing({_type: schemaType.name}), set(nextSlug, ['current'])]),
      )

      if (publishedSlug) {
        const currentHistory = props.value?.history || []

        // Check if the current slug is the same as the last published slug
        // if it's the same, remove the last published slug from the history array
        const lastHistory = currentHistory[currentHistory.length - 1]
        if (lastHistory?.slug === nextSlug) {
          const nextHistory = currentHistory.slice(0, -1)
          if (nextHistory.length === 0) {
            onChange(PatchEvent.from([unset(['history'])]))
          } else {
            onChange(PatchEvent.from([set(nextHistory, ['history'])]))
          }
          return
        }

        if (nextSlug !== publishedSlug) {
          // We need to check if the currentHistory includes the last published slug with the lastSeen matching the published._rev
          // If it's included, don't do anything
          // If it's not included, push the published slug to the history array
          const newSlugEntry = {
            slug: publishedSlug,
            lastSeen: published?._rev,
            _key: uuid(),
            lastSeenPublishedAt: published?._updatedAt,
          }
          const exists = currentHistory.find(
            (item) => item.slug === newSlugEntry.slug && item.lastSeen === newSlugEntry.lastSeen,
          )
          if (exists) return
          // Create the history array if it doesn't exist and push the published slug to it
          onChange(
            PatchEvent.from([
              setIfMissing([], ['history']),
              set([...currentHistory, newSlugEntry], ['history']),
            ]),
          )
        }
      }
    },
    [
      onChange,
      schemaType.name,
      publishedSlug,
      props.value?.history,
      published?._rev,
      published?._updatedAt,
    ],
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
      <Code size={1} muted>
        {JSON.stringify(value, null, 2)}
      </Code>
    </Stack>
  )
}
