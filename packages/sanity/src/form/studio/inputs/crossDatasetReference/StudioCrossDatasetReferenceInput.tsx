import React, {useCallback, useMemo, useRef} from 'react'
import {
  CrossDatasetReference,
  CrossDatasetReferenceSchemaType,
  Path,
  ReferenceFilterOptions,
  ReferenceFilterSearchOptions,
  SanityDocument,
} from '@sanity/types'
import {get} from '@sanity/util/paths'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'
import {Box, Stack, Text, TextSkeleton} from '@sanity/ui'
import {CrossDatasetReferenceInput} from '../../../inputs/CrossDatasetReferenceInput'
import {Alert} from '../../../components/Alert'
import {useDocumentPreviewStore} from '../../../../datastores'
import {useClient, useProjectId} from '../../../../hooks'
import {FIXME, ObjectInputProps} from '../../../types'
import {useFormValue} from '../../../useFormValue'
import {search} from './datastores/search'
import {createGetReferenceInfo} from './datastores/getReferenceInfo'
import {useCrossProjectToken} from './datastores/useCrossProjectToken'

// eslint-disable-next-line require-await
async function resolveUserDefinedFilter(
  options: ReferenceFilterOptions | undefined,
  document: SanityDocument,
  valuePath: Path
): Promise<ReferenceFilterSearchOptions> {
  if (!options) {
    return {}
  }

  if (typeof options.filter === 'function') {
    const parentPath = valuePath.slice(0, -1)
    const parent = get(document, parentPath) as Record<string, unknown>
    return options.filter({document, parentPath, parent})
  }

  return {
    filter: options.filter,
    params: 'filterParams' in options ? options.filterParams : undefined,
  }
}

export type StudioCrossDatasetReferenceInputProps = ObjectInputProps<
  CrossDatasetReference,
  CrossDatasetReferenceSchemaType
>

function useValueRef<T>(value: T): {current: T} {
  const ref = useRef(value)
  ref.current = value
  return ref
}

type SearchError = {
  message: string
  details?: {
    type: string
    description: string
  }
}

export function StudioCrossDatasetReferenceInput(props: StudioCrossDatasetReferenceInputProps) {
  const {path, schemaType} = props
  const client = useClient()
  const projectId = useProjectId()
  const documentPreviewStore = useDocumentPreviewStore()

  const isCurrentProject = projectId === schemaType.projectId
  const loadableToken = useCrossProjectToken(client, {
    projectId: schemaType.projectId,
    tokenId: schemaType.tokenId,
  })

  const crossDatasetClient = useMemo(() => {
    const token = isCurrentProject
      ? undefined
      : loadableToken?.status === 'loaded' && loadableToken.result

    return (
      client
        .withConfig({
          projectId: schemaType.projectId,
          dataset: schemaType.dataset,
          apiVersion: '2022-03-07',
          token: token || undefined,
          ignoreBrowserTokenWarning: true,
        })

        // seems like this is required to prevent this client from sometimes magically get mutated with a new projectId and dataset
        .clone()
    )
  }, [client, isCurrentProject, loadableToken, schemaType.projectId, schemaType.dataset])

  const documentValue = useFormValue([]) as FIXME
  const documentRef = useValueRef(documentValue)

  const handleSearch = useCallback(
    (searchString: string) =>
      from(resolveUserDefinedFilter(schemaType.options, documentRef.current, path)).pipe(
        mergeMap(({filter, params}) =>
          search(crossDatasetClient, searchString, schemaType, {
            ...schemaType.options,
            filter,
            params,
            tag: 'search.cross-dataset-reference',
          })
        ),

        catchError((err: SearchError) => {
          const isQueryError = err.details && err.details.type === 'queryParseError'
          if (schemaType.options?.filter && isQueryError) {
            err.message = `Invalid reference filter, please check the custom "filter" option`
          }
          return throwError(err)
        })
      ),

    [crossDatasetClient, documentRef, path, schemaType]
  )

  const getReferenceInfo = useMemo(
    () => createGetReferenceInfo({client: crossDatasetClient, documentPreviewStore}),
    [crossDatasetClient, documentPreviewStore]
  )

  if (loadableToken?.status === 'loading') {
    return (
      <Box padding={2}>
        <Stack space={2}>
          <Stack space={2} padding={1}>
            <TextSkeleton style={{maxWidth: 320}} radius={1} />
            <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} />
          </Stack>
        </Stack>
      </Box>
    )
  }

  if (!isCurrentProject && loadableToken?.status === 'loaded' && !loadableToken.result) {
    return (
      <Stack space={2} marginY={2}>
        <Text size={1} weight="semibold">
          {schemaType.title}
        </Text>
        <Alert title="No cross dataset read token found" size={1} muted>
          <Stack space={3}>
            <Text size={1}>
              This cross dataset reference field requires a cross dataset token to be registered.
              Please configure a token{' '}
              {schemaType.tokenId ? (
                <>
                  with ID <b>{schemaType.tokenId}</b>
                </>
              ) : null}{' '}
              for project <b>{schemaType.projectId}</b> that has read access to the{' '}
              <b>{schemaType.dataset}</b>
              -dataset.
            </Text>
            <Text size={1}>
              See the documentation for{' '}
              <a href="https://www.sanity.io/docs/cross-dataset-references">
                Cross Dataset References
              </a>{' '}
              for more details.
            </Text>
          </Stack>
        </Alert>
      </Stack>
    )
  }

  return (
    <CrossDatasetReferenceInput
      {...props}
      getReferenceInfo={getReferenceInfo}
      onSearch={handleSearch}
    />
  )
}
