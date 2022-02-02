import React, {ForwardedRef, forwardRef, useCallback, useMemo, useRef, useState} from 'react'

import {
  CrossDatasetReference,
  CrossDatasetReferenceSchemaType,
  Marker,
  Path,
  ReferenceFilterOptions,
  ReferenceFilterSearchOptions,
  SanityDocument,
} from '@sanity/types'
import {get} from '@sanity/util/paths'
import {FormFieldPresence} from '@sanity/base/presence'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'
import sanityClient from '@sanity/client'
import {Box, Button, Flex, Stack, Text, TextInput, TextSkeleton} from '@sanity/ui'
import withValuePath from '../../../utils/withValuePath'
import withDocument from '../../../utils/withDocument'
import PatchEvent from '../../../PatchEvent'
import {CrossDatasetReferenceInput} from '../../../inputs/CrossDatasetReferenceInput'
import {versionedClient} from '../../versionedClient'
import {search} from './datastores/search'
import {getReferenceInfo} from './datastores/getReferenceInfo'
import {useCrossDatasetToken} from './datastores/useCrossDatasetToken'

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

export type Props = {
  value?: CrossDatasetReference
  compareValue?: CrossDatasetReference
  type: CrossDatasetReferenceSchemaType
  markers: Marker[]
  focusPath: Path
  readOnly?: boolean
  onFocus: (path: Path) => void
  onChange: (event: PatchEvent) => void
  level: number
  presence: FormFieldPresence[]

  // From withDocument
  document: SanityDocument

  // From withValuePath
  getValuePath: () => Path
}

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

const SanityCrossDatasetReferenceInput = forwardRef(function SanityCrossDatasetReferenceInput(
  props: Props,
  ref: ForwardedRef<HTMLInputElement>
) {
  const {getValuePath, type, document} = props

  const [loadableToken, saveToken] = useCrossDatasetToken(versionedClient, {
    projectId: type.projectId,
    dataset: type.dataset,
    tokenId: type.tokenId,
  })

  const [reconfigureToken, setReconfigureToken] = useState(false)

  const handleReconfigureToken = useCallback(() => {
    setReconfigureToken(true)
  }, [])

  const tokenInput = useRef<HTMLInputElement>()

  const crossDatasetClient = useMemo(() => {
    return loadableToken.status === 'loaded' && loadableToken.result?.token
      ? sanityClient({
          projectId: 'ppsg7ml5',
          dataset: 'playground',
          apiVersion: '2022-01-21', // use current UTC date - see "specifying API version"!
          token: loadableToken.result.token,
          useCdn: false,
        })
      : null
  }, [loadableToken])

  const documentRef = useValueRef(document)

  const handleSearch = useCallback(
    (searchString: string) =>
      from(resolveUserDefinedFilter(type.options, documentRef.current, getValuePath())).pipe(
        mergeMap(({filter, params}) =>
          search(crossDatasetClient, searchString, type, {
            ...type.options,
            filter,
            params,
            tag: 'search.cross-dataset-reference',
          })
        ),
        catchError((err: SearchError) => {
          const isQueryError = err.details && err.details.type === 'queryParseError'
          if (type.options?.filter && isQueryError) {
            err.message = `Invalid reference filter, please check the custom "filter" option`
          }
          return throwError(err)
        })
      ),
    [crossDatasetClient, documentRef, getValuePath, type]
  )

  const _getReferenceInfo = useCallback(
    (id: string) => (crossDatasetClient ? getReferenceInfo(crossDatasetClient, type, id) : null),
    [crossDatasetClient, type]
  )

  if (loadableToken.status === 'loading') {
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

  if (reconfigureToken || (loadableToken.status === 'loaded' && !loadableToken.result?.token)) {
    return (
      <Stack space={2} marginY={2}>
        <Text size={1} weight="semibold">
          Cross dataset read token
        </Text>
        <Text size={1} muted>
          Provide a value for token with id "<b>{type.tokenId}</b>" for dataset{' '}
          <b>{type.dataset}</b> in project <b>{type.projectId}</b>
        </Text>
        <Flex>
          <Box flex={1}>
            <TextInput ref={tokenInput} />
          </Box>
          <Box paddingX={2}>
            <Button
              text={reconfigureToken ? 'Update' : 'Continue'}
              mode="ghost"
              tone="positive"
              onClick={() => {
                if (tokenInput.current) {
                  saveToken(tokenInput.current.value || undefined)
                }
              }}
            />
          </Box>
          {reconfigureToken && (
            <Box paddingX={2}>
              <Button text="Close" mode="bleed" onClick={() => setReconfigureToken(false)} />
            </Box>
          )}
        </Flex>
        <Text muted size={1}>
          {loadableToken.status === 'loaded' && loadableToken.result?._updatedAt ? (
            <>
              Token <code>{obfuscate(loadableToken.result.token)}</code> was last updated{' '}
              {loadableToken.result._updatedAt}
            </>
          ) : (
            <>No token added</>
          )}
        </Text>
      </Stack>
    )
  }

  return (
    <CrossDatasetReferenceInput
      {...props}
      onSearch={handleSearch}
      getReferenceInfo={_getReferenceInfo}
      onReconfigureToken={handleReconfigureToken}
      ref={ref}
    />
  )
})

function obfuscate(token: string) {
  return `${token.substring(0, 3)}(...)${token.substring(token.length - 3)}`
}

export default withValuePath(withDocument(SanityCrossDatasetReferenceInput))
