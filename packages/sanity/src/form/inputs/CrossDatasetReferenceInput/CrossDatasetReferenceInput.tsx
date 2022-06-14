/* eslint-disable complexity, max-nested-callbacks, no-nested-ternary */

import React, {useCallback, useMemo, useRef, useState} from 'react'
import {CrossDatasetReference, CrossDatasetReferenceSchemaType} from '@sanity/types'
import {EllipsisVerticalIcon, ResetIcon as ClearIcon, SyncIcon as ReplaceIcon} from '@sanity/icons'
import {concat, Observable, of} from 'rxjs'
import {useId} from '@reach/auto-id'
import {catchError, distinctUntilChanged, filter, map, scan, switchMap, tap} from 'rxjs/operators'
import {
  Box,
  Button,
  Card,
  Flex,
  Inline,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Text,
  useForwardedRef,
  useToast,
} from '@sanity/ui'
import {useObservableCallback} from 'react-rx'
import {FIXME, ObjectInputProps} from '../../types'
import {set, unset} from '../../patch'
import {AlertStrip} from '../../components/AlertStrip'
import {useOnClickOutside} from '../../hooks/useOnClickOutside'
import {isNonNullable} from '../../utils/isNonNullable'
import {getPublishedId} from '../../../util'
import {ChangeIndicator} from '../../../components/changeIndicators'
import {CrossDatasetReferenceInfo, CrossDatasetSearchHit, SearchState} from './types'
import {OptionPreview} from './OptionPreview'
import {GetReferenceInfoFn, useReferenceInfo} from './useReferenceInfo'
import {PreviewReferenceValue} from './PreviewReferenceValue'
import {ReferenceAutocomplete} from './ReferenceAutocomplete'
import {PreviewCard} from './PreviewCard'

const INITIAL_SEARCH_STATE: SearchState = {
  hits: [],
  isLoading: false,
}

export interface CrossDatasetReferenceInputProps
  extends ObjectInputProps<CrossDatasetReference, CrossDatasetReferenceSchemaType> {
  getReferenceInfo: (
    doc: {_id: string; _type?: string},
    type: CrossDatasetReferenceSchemaType
  ) => Observable<CrossDatasetReferenceInfo>
  onSearch: (query: string) => Observable<CrossDatasetSearchHit[]>
}

const NO_FILTER = () => true

const REF_PATH = ['_ref']

export function CrossDatasetReferenceInput(props: CrossDatasetReferenceInputProps) {
  const {
    changed,
    focused,
    focusPath,
    focusRef,
    getReferenceInfo,
    onBlur,
    onChange,
    onFocusPath,
    onSearch,
    path,
    readOnly,
    schemaType,
    validation,
    value,
  } = props

  const forwardedRef = useForwardedRef(focusRef)

  const [searchState, setSearchState] = useState<SearchState>(INITIAL_SEARCH_STATE)

  const handleChange = useCallback(
    (id: string) => {
      if (!id) {
        onChange(unset())
        onFocusPath([])
        return
      }

      const hit = searchState.hits.find((h) => h.id === id)

      if (!hit) {
        throw new Error('Selected an item that wasnt part of the result set')
      }

      onChange(
        set({
          _type: schemaType.name,
          _ref: getPublishedId(id),
          _projectId: schemaType.projectId,
          _dataset: schemaType.dataset,
          _weak: schemaType.weak,
          // persist _key between mutations if the value is in an array
          _key: value?._key,
        })
      )

      onFocusPath([])
    },
    [
      value?._key,
      searchState.hits,
      schemaType.name,
      schemaType.projectId,
      schemaType.dataset,
      schemaType.weak,
      onChange,
      onFocusPath,
    ]
  )

  const handleClear = useCallback(() => {
    onChange(unset())
  }, [onChange])

  const handleAutocompleteKeyDown = useCallback(
    (event) => {
      // escape
      if (event.keyCode === 27) {
        onFocusPath?.([])
      }
    },
    [onFocusPath]
  )

  const getReferenceInfoMemo: GetReferenceInfoFn = useCallback(
    (doc) => getReferenceInfo(doc, schemaType),
    [getReferenceInfo, schemaType]
  )

  const refDoc = useMemo(() => ({_id: value?._ref}), [value?._ref])

  const loadableReferenceInfo = useReferenceInfo(refDoc as FIXME, getReferenceInfoMemo)

  const autocompletePopoverReferenceElementRef = useRef<HTMLDivElement | null>(null)

  const hasFocusAtRef = focusPath.length === 1 && focusPath[0] === '_ref'

  // --- focus handling
  // const focusElementRef = useForwardedRef(forwardedRef)
  // useDidUpdate({hasFocusAt: hasFocusAtRef, ref: value?._ref}, (prev, current) => {
  //   const refUpdated = prev?.ref !== current.ref
  //   const focusAtUpdated = prev?.hasFocusAt !== current.hasFocusAt

  //   if ((focusAtUpdated || refUpdated) && current.hasFocusAt) {
  //     // if search mode changed and we're having focus always ensure the
  //     // ref element gets focus
  //     focusElementRef.current?.focus()
  //   }
  // })

  const weakIs = value?._weak ? 'weak' : 'strong'
  const weakShouldBe = schemaType.weak === true ? 'weak' : 'strong'

  const hasRef = Boolean(value?._ref)

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(schemaType.weak === true ? set(true, ['_weak']) : unset(['_weak']))
  }, [onChange, schemaType])

  const {push} = useToast()

  const errors = useMemo(() => validation.filter((item) => item.level === 'error'), [validation])

  const handleFocus = useCallback(
    (event) => {
      if (onFocusPath && event.currentTarget === forwardedRef.current) {
        onFocusPath([])
      }
    },
    [forwardedRef, onFocusPath]
  )

  const handleAutocompleteFocus = useCallback(
    (event) => {
      if (onFocusPath && event.currentTarget === forwardedRef.current) {
        onFocusPath(REF_PATH)
      }
    },
    [forwardedRef, onFocusPath]
  )

  const handleQueryChange = useObservableCallback((inputValue$: Observable<string | null>) => {
    return inputValue$.pipe(
      filter(isNonNullable),
      distinctUntilChanged(),
      switchMap((searchString) =>
        concat(
          of({isLoading: true}),
          onSearch(searchString).pipe(
            map((hits) => ({hits, searchString, isLoading: false})),
            catchError((error) => {
              push({
                title: 'Reference search failed',
                description: error.message,
                status: 'error',
                id: `reference-search-fail-${inputId}`,
              })

              console.error(error)
              return of({hits: []})
            })
          )
        )
      ),

      scan(
        (prevState, nextState): SearchState => ({...prevState, ...nextState}),
        INITIAL_SEARCH_STATE
      ),

      tap(setSearchState)
    )
  }, [])

  const handleAutocompleteOpenButtonClick = useCallback(() => {
    handleQueryChange('')
  }, [handleQueryChange])

  const showWeakRefMismatch = !loadableReferenceInfo.isLoading && hasRef && weakIs !== weakShouldBe

  const inputId = useId()

  const studioUrl =
    (value?._ref &&
      schemaType.studioUrl?.({
        id: value?._ref,
        type: loadableReferenceInfo?.result?.type,
      })) ||
    null

  const renderOption = useCallback(
    (option) => {
      return (
        <PreviewCard forwardedAs="button" type="button" radius={2}>
          <Box paddingX={3} paddingY={1}>
            <OptionPreview
              referenceType={schemaType}
              document={option.hit.published}
              getReferenceInfo={getReferenceInfoMemo}
            />
          </Box>
        </PreviewCard>
      )
    },
    [schemaType, getReferenceInfoMemo]
  )

  const preview = loadableReferenceInfo.result?.preview.published

  const isEditing = hasFocusAtRef || !value?._ref

  // --- click outside handling
  const clickOutsideBoundaryRef = useRef<HTMLDivElement | null>(null)
  const autocompletePortalRef = useRef<HTMLDivElement | null>(null)
  const createButtonMenuPortalRef = useRef<HTMLDivElement | null>(null)
  useOnClickOutside(
    [clickOutsideBoundaryRef, autocompletePortalRef, createButtonMenuPortalRef],
    () => {
      if (hasFocusAtRef) {
        onFocusPath([])
      }
    }
  )

  return (
    <Stack space={1} marginY={isEditing ? 2 : 0}>
      {isEditing ? (
        <Stack space={2} ref={clickOutsideBoundaryRef}>
          <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
            <div ref={autocompletePopoverReferenceElementRef}>
              <ReferenceAutocomplete
                data-testid="autocomplete"
                loading={searchState.isLoading}
                ref={forwardedRef}
                referenceElement={autocompletePopoverReferenceElementRef.current}
                portalRef={autocompletePortalRef}
                id={inputId || ''}
                options={searchState.hits.map((hit) => ({
                  value: hit.id,
                  hit: hit,
                }))}
                onFocus={handleAutocompleteFocus}
                onBlur={onBlur}
                radius={1}
                placeholder="Type to search"
                onKeyDown={handleAutocompleteKeyDown}
                readOnly={readOnly}
                disabled={loadableReferenceInfo.isLoading}
                onQueryChange={handleQueryChange}
                searchString={searchState.searchString}
                onChange={handleChange}
                filterOption={NO_FILTER}
                renderOption={renderOption}
                openButton={{onClick: handleAutocompleteOpenButtonClick}}
              />
            </div>
          </ChangeIndicator>
        </Stack>
      ) : (
        <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
          <Card
            padding={0}
            border
            radius={1}
            tone={
              readOnly
                ? 'transparent'
                : loadableReferenceInfo.error || errors.length > 0
                ? 'critical'
                : 'default'
            }
          >
            <Flex align="center" padding={1}>
              {studioUrl ? (
                <PreviewCard
                  forwardedAs="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={studioUrl}
                  data-as="a"
                  flex={1}
                  padding={1}
                  paddingRight={3}
                  radius={2}
                  tone="inherit"
                  __unstable_focusRing
                  tabIndex={0}
                  onFocus={handleFocus}
                  ref={forwardedRef}
                >
                  <PreviewReferenceValue
                    value={value}
                    referenceInfo={loadableReferenceInfo}
                    showStudioUrlIcon
                    hasStudioUrl={!!studioUrl}
                    type={schemaType}
                  />
                </PreviewCard>
              ) : (
                <PreviewCard
                  flex={1}
                  padding={1}
                  paddingRight={3}
                  radius={2}
                  tone="inherit"
                  __unstable_focusRing
                  tabIndex={0}
                  onFocus={handleFocus}
                  ref={forwardedRef}
                >
                  <PreviewReferenceValue
                    value={value}
                    referenceInfo={loadableReferenceInfo}
                    showStudioUrlIcon
                    type={schemaType}
                  />
                </PreviewCard>
              )}

              <Inline paddingX={1}>
                <MenuButton
                  button={
                    <Button
                      padding={2}
                      mode="bleed"
                      icon={EllipsisVerticalIcon}
                      data-testid="menu-button"
                    />
                  }
                  id={`${inputId}-menuButton`}
                  menu={
                    <Menu>
                      {!readOnly && (
                        <>
                          <MenuItem
                            text="Clear"
                            tone="critical"
                            icon={ClearIcon}
                            data-testid="menu-item-clear"
                            onClick={handleClear}
                          />

                          <MenuItem
                            text="Replace"
                            icon={ReplaceIcon}
                            data-testid="menu-item-replace"
                            onClick={() => {
                              onFocusPath(REF_PATH)
                            }}
                          />
                        </>
                      )}
                    </Menu>
                  }
                  placement="right"
                  popover={{portal: true, tone: 'default'}}
                />
              </Inline>
            </Flex>
            {showWeakRefMismatch && (
              <AlertStrip
                padding={1}
                title="Reference strength mismatch"
                status="warning"
                data-testid="alert-reference-strength-mismatch"
              >
                <Stack space={3}>
                  <Text as="p" muted size={1}>
                    This reference is <em>{weakIs}</em>, but according to the current schema it
                    should be <em>{weakShouldBe}.</em>
                  </Text>

                  <Text as="p" muted size={1}>
                    {schemaType.weak ? (
                      <>
                        It will not be possible to delete the "{preview?.title}"-document without
                        first removing this reference.
                      </>
                    ) : (
                      <>
                        This makes it possible to delete the "{preview?.title}"-document without
                        first deleting this reference, leaving this field referencing a nonexisting
                        document.
                      </>
                    )}
                  </Text>
                  <Button
                    onClick={handleFixStrengthMismatch}
                    text={<>Convert to {weakShouldBe} reference</>}
                    tone="caution"
                  />
                </Stack>
              </AlertStrip>
            )}

            {loadableReferenceInfo.error && (
              <AlertStrip
                padding={1}
                title="Unable to load reference metadata"
                status="warning"
                data-testid="alert-reference-info-failed"
              >
                <Stack space={3}>
                  <Text as="p" muted size={1}>
                    Error: {loadableReferenceInfo.error.message}
                  </Text>
                  <Button onClick={loadableReferenceInfo.retry!} text={<>Retry</>} tone="primary" />
                </Stack>
              </AlertStrip>
            )}
          </Card>
        </ChangeIndicator>
      )}
    </Stack>
  )
}
