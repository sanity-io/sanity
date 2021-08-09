/* eslint-disable max-nested-callbacks */
import React, {ForwardedRef, forwardRef, useCallback, useMemo, useState} from 'react'
import {isValidationErrorMarker, Marker, Path, Reference, ReferenceSchemaType} from '@sanity/types'
import {LinkIcon} from '@sanity/icons'
import {concat, Observable, of} from 'rxjs'
import {useId} from '@reach/auto-id'
import {catchError, distinctUntilChanged, filter, map, scan, switchMap, tap} from 'rxjs/operators'
import {Autocomplete, Box, Card, Text, Button, Stack, useToast, useForwardedRef} from '@sanity/ui'
import {FormField} from '@sanity/base/components'
import {FormFieldPresence} from '@sanity/base/presence'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/change-indicators'
import {useObservableCallback} from 'react-rx'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import Preview from '../../Preview'
import {Alert} from '../../components/Alert'
import {Details} from '../../components/Details'
import {IntentButton} from '../../transitional/IntentButton'
import {EMPTY_ARRAY, EMPTY_OBJECT} from '../../utils/empty'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {usePreviewSnapshot} from './usePreviewSnapshot'

type SearchState = {
  hits: SearchHit[]
  isLoading: boolean
}

const INITIAL_SEARCH_STATE: SearchState = {
  hits: [],
  isLoading: false,
}

type PreviewSnapshot = {
  _id: string
  _type: string
  title: string
  description: string
}

type SearchFunction = (query: string) => Observable<SearchHit[]>

export type Props = {
  value?: Reference
  compareValue?: Reference
  type: ReferenceSchemaType
  markers: Marker[]
  focusPath: Path
  readOnly?: boolean
  onSearch: SearchFunction
  onFocus?: (path: Path) => void
  onBlur?: () => void
  getPreviewSnapshot: (reference: Reference) => Observable<PreviewSnapshot | null>
  onChange: (event: PatchEvent) => void
  level: number
  presence: FormFieldPresence[]
}

function getMemberTypeFor(typeName: string, ownerType: ReferenceSchemaType) {
  return ownerType.to.find((ofType) => ofType.type?.name === typeName)
}

type SearchHit = {
  _id: string
  _type: string
}

const NO_FILTER = () => true

function nonNullable<T>(v: T): v is NonNullable<T> {
  return v !== null
}

export const ReferenceInput = forwardRef(function ReferenceInput(
  props: Props,
  forwardedRef: ForwardedRef<HTMLInputElement>
) {
  const {
    type,
    value,
    level,
    markers,
    readOnly,
    onSearch,
    onChange,
    presence,
    compareValue,
    focusPath = EMPTY_ARRAY,
    onFocus,
    onBlur,
    getPreviewSnapshot,
  } = props

  const handleChange = useCallback(
    (id: string) => {
      const events =
        id === ''
          ? [unset()]
          : [
              setIfMissing({
                _type: type.name,
                _ref: id,
              }),
              type.weak === true ? set(true, ['_weak']) : unset(['_weak']),
              set(id, ['_ref']),
            ]
      onChange(PatchEvent.from(events))
    },
    [onChange, type]
  )

  const preview = usePreviewSnapshot(value, getPreviewSnapshot)

  const weakIs = value?._weak ? 'weak' : 'strong'
  const weakShouldBe = type.weak === true ? 'weak' : 'strong'
  const hasInsufficientPermissions =
    preview.snapshot?._internalMeta?.type === 'insufficient_permissions'
  const isMissing =
    !hasInsufficientPermissions && !!value?._ref && !preview.isLoading && preview.snapshot === null

  const hasRef = value && value._ref

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(PatchEvent.from(type.weak === true ? set(true, ['_weak']) : unset(['_weak'])))
  }, [onChange, type])

  const {push} = useToast()

  const [searchState, setSearchState] = useState<SearchState>(INITIAL_SEARCH_STATE)

  const errors = useMemo(() => markers.filter(isValidationErrorMarker), [markers])

  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(['_ref'])
    }
  }, [onFocus])

  const handleQueryChange = useObservableCallback((inputValue$: Observable<string | null>) => {
    return inputValue$.pipe(
      distinctUntilChanged(),
      filter(nonNullable),
      switchMap((searchString) =>
        concat(
          of({isLoading: true}),
          onSearch(searchString).pipe(
            map((hits) => ({hits})),
            catchError((error) => {
              push({
                title: 'Reference search failed',
                description: error.message,
                status: 'error',
                id: `reference-search-fail-${inputId}`,
              })
              return of({hits: []})
            })
          ),
          of({isLoading: false})
        )
      ),
      scan(
        (prevState, nextState): SearchState => ({...prevState, ...nextState}),
        INITIAL_SEARCH_STATE
      ),
      tap(setSearchState)
    )
  }, [])

  const handleOpenButtonClick = useCallback(() => {
    handleQueryChange('')
  }, [handleQueryChange])

  const renderValue = useCallback(
    (autocompleteValue) => {
      if (autocompleteValue === '') {
        return ''
      }
      if (hasInsufficientPermissions) {
        return '<insufficient permissions>'
      }
      if (isMissing) {
        return '<nonexistent document>'
      }
      return preview.isLoading ? 'Loading…' : preview.snapshot?.title || 'Untitled'
    },
    [isMissing, hasInsufficientPermissions, preview]
  )

  const inputId = useId()

  const ref = useForwardedRef(forwardedRef)
  useDidUpdate(focusPath[0], (prev, current) => {
    if (prev !== '_ref' && current === '_ref') {
      ref.current?.focus()
    }
  })

  const renderOption = useCallback(
    (option) => {
      const memberType = getMemberTypeFor(option.hit._type, type)
      return (
        <Card as="button">
          <Box paddingX={3} paddingY={2}>
            {memberType ? (
              <Preview type={memberType} value={option.hit} layout="default" />
            ) : (
              <>Reference search returned a document type that is not a valid member</>
            )}
          </Box>
        </Card>
      )
    },
    [type]
  )

  const placeholder = preview.isLoading ? 'Loading…' : 'Type to search…'
  return (
    <FormField
      htmlFor={inputId}
      __unstable_markers={markers}
      __unstable_presence={presence}
      __unstable_changeIndicator={false}
      title={type.title}
      level={level}
      description={type.description}
    >
      <Stack space={3}>
        {hasInsufficientPermissions && (
          <Alert title="Insufficient permissions to access this reference" status="warning">
            <Text as="p" muted size={1}>
              You don't have access to the referenced document. Please contact an admin for access
              or remove this reference.
            </Text>
          </Alert>
        )}

        {hasRef && !isMissing && weakIs !== weakShouldBe && (
          <Alert
            title="Reference strength mismatch"
            status="warning"
            suffix={
              <Stack padding={2}>
                <Button
                  onClick={handleFixStrengthMismatch}
                  text={<>Convert to {weakShouldBe} reference</>}
                  tone="caution"
                />
              </Stack>
            }
          >
            <Text as="p" muted size={1}>
              This reference is <em>{weakIs}</em>, but according to the current schema it should be{' '}
              <em>{weakShouldBe}.</em>
            </Text>
            <Details marginTop={4} title={<>Details</>}>
              <Stack space={3}>
                <Text as="p" muted size={1}>
                  {type.weak ? (
                    <>
                      This reference is currently marked as a <em>strong reference</em>. It will not
                      be possible to delete the "{preview.snapshot?.title}"-document without first
                      removing this reference.
                    </>
                  ) : (
                    <>
                      This reference is currently marked as a <em>weak reference</em>. This makes it
                      possible to delete the "{preview.snapshot?.title}"-document without first
                      deleting this reference, leaving this field referencing a nonexisting
                      document.
                    </>
                  )}
                </Text>
              </Stack>
            </Details>
          </Alert>
        )}

        {value && isMissing && !hasInsufficientPermissions && (
          <Alert title="Nonexistent document reference" status="warning">
            <Text as="p" muted size={1}>
              This field is currently referencing a document that doesn't exist (ID:{' '}
              <code>{value._ref}</code>). You can either remove the reference or replace it with an
              existing document.
            </Text>
          </Alert>
        )}

        <ChangeIndicatorWithProvidedFullPath
          path={[]}
          hasFocus={focusPath[0] === '_ref'}
          value={value?._ref}
          compareValue={compareValue?._ref}
        >
          <div style={{lineHeight: 0}}>
            <Autocomplete
              loading={searchState.isLoading}
              ref={ref}
              id={inputId || ''}
              options={searchState.hits.map((hit) => ({
                value: hit._id,
                hit: hit,
              }))}
              onFocus={handleFocus}
              onBlur={onBlur}
              radius={1}
              readOnly={readOnly}
              value={value?._ref}
              placeholder={readOnly ? '' : placeholder}
              customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
              onQueryChange={handleQueryChange}
              onChange={handleChange}
              filterOption={NO_FILTER}
              renderOption={renderOption}
              renderValue={renderValue}
              openButton={{onClick: handleOpenButtonClick}}
              prefix={
                <Box padding={1}>
                  <IntentButton
                    disabled={!preview.snapshot}
                    icon={LinkIcon}
                    title={preview.snapshot ? `Open ${preview.snapshot?.title}` : 'Loading…'}
                    intent="edit"
                    mode="bleed"
                    padding={2}
                    params={
                      preview.snapshot
                        ? {
                            id: preview.snapshot._id,
                            type: preview.snapshot._type,
                          }
                        : EMPTY_OBJECT
                    }
                  />
                </Box>
              }
            />
          </div>
        </ChangeIndicatorWithProvidedFullPath>
      </Stack>
    </FormField>
  )
})
