/* eslint-disable complexity */
/* eslint-disable max-nested-callbacks,no-nested-ternary */
import React, {ForwardedRef, forwardRef, useCallback, useMemo, useRef, useState} from 'react'
import {CrossDatasetReference, isValidationErrorMarker} from '@sanity/types'
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
import {ChangeIndicatorForFieldPath, FormField} from '@sanity/base/components'
import {getPublishedId} from '@sanity/base/_internal'
import {useObservableCallback} from 'react-rx'
import PatchEvent, {set, unset} from '../../PatchEvent'
import {EMPTY_ARRAY} from '../../utils/empty'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {AlertStrip} from '../../AlertStrip'
import {useOnClickOutside} from '../../hooks/useOnClickOutside'
import {getProjectId} from './utils/getProjectId'
import {BaseInputProps, SearchState} from './types'
import {OptionPreview} from './OptionPreview'
import {useReferenceInfo} from './useReferenceInfo'
import {PreviewReferenceValue} from './PreviewReferenceValue'
import {ReferenceAutocomplete} from './ReferenceAutocomplete'
import {PreviewCard} from './PreviewCard'

const INITIAL_SEARCH_STATE: SearchState = {
  hits: [],
  isLoading: false,
}

export interface Props extends BaseInputProps {
  value?: CrossDatasetReference
}

const NO_FILTER = () => true

function nonNullable<T>(v: T): v is NonNullable<T> {
  return v !== null
}

type $TODO = any

const REF_PATH = ['_ref']
export const CrossDatasetReferenceInput = forwardRef(function CrossDatasetReferenceInput(
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
    focusPath = EMPTY_ARRAY,
    onFocus,
    onBlur,
    compareValue,
    getReferenceInfo,
  } = props

  const projectId = useMemo(() => getProjectId(), [])

  const [searchState, setSearchState] = useState<SearchState>(INITIAL_SEARCH_STATE)

  const handleChange = useCallback(
    (id: string) => {
      if (!id) {
        onChange(PatchEvent.from(unset()))
        onFocus?.([])
        return
      }

      const hit = searchState.hits.find((h) => h.id === id)

      if (!hit) {
        throw new Error('Selected an item that wasnt part of the result set')
      }

      onChange(
        PatchEvent.from(
          set({
            _type: type.name,
            _ref: getPublishedId(id),
            _projectId: projectId,
            _dataset: type.dataset,
            _weak: type.weak,
            // persist _key between mutations if the value is in an array
            _key: value?._key,
          })
        )
      )
      onFocus?.([])
    },
    [
      value?._key,
      searchState.hits,
      type.name,
      type.dataset,
      type.weak,
      projectId,
      onChange,
      onFocus,
    ]
  )

  const handleClear = useCallback(() => {
    onChange(PatchEvent.from(unset()))
  }, [onChange])

  const handleAutocompleteKeyDown = useCallback(
    (event) => {
      // escape
      if (event.keyCode === 27) {
        onFocus?.([])
      }
    },
    [onFocus]
  )

  const getReferenceInfoMemo = useCallback((id) => getReferenceInfo(id, type), [
    getReferenceInfo,
    type,
  ])

  const refDoc = useMemo(() => ({_id: value?._ref}), [value?._ref])

  const loadableReferenceInfo = useReferenceInfo(refDoc, getReferenceInfoMemo)

  const autocompletePopoverReferenceElementRef = useRef()

  // --- focus handling
  const hasFocusAtRef = focusPath.length === 1 && focusPath[0] === '_ref'
  const focusElementRef = useForwardedRef(forwardedRef)
  useDidUpdate({hasFocusAt: hasFocusAtRef, ref: value?._ref}, (prev, current) => {
    const refUpdated = prev.ref !== current.ref
    const focusAtUpdated = prev.hasFocusAt !== current.hasFocusAt

    if ((focusAtUpdated || refUpdated) && current.hasFocusAt) {
      // if search mode changed and we're having focus always ensure the
      // ref element gets focus
      focusElementRef.current?.focus()
    }
  })

  const weakIs = value?._weak ? 'weak' : 'strong'
  const weakShouldBe = type.weak === true ? 'weak' : 'strong'

  const hasRef = Boolean(value?._ref)

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(PatchEvent.from(type.weak === true ? set(true, ['_weak']) : unset(['_weak'])))
  }, [onChange, type])

  const {push} = useToast()

  const errors = useMemo(() => markers.filter(isValidationErrorMarker), [markers])

  const handleFocus = useCallback(
    (event) => {
      if (onFocus && event.currentTarget === focusElementRef.current) {
        onFocus([])
      }
    },
    [onFocus, focusElementRef]
  )
  const handleAutocompleteFocus = useCallback(
    (event) => {
      if (onFocus && event.currentTarget === focusElementRef.current) {
        onFocus(['_ref'])
      }
    },
    [onFocus, focusElementRef]
  )

  const handleQueryChange = useObservableCallback((inputValue$: Observable<string | null>) => {
    return inputValue$.pipe(
      filter(nonNullable),
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
      type.studioUrl?.({
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
              referenceType={type}
              document={option.hit.published}
              getReferenceInfo={getReferenceInfoMemo}
            />
          </Box>
        </PreviewCard>
      )
    },
    [type, getReferenceInfoMemo]
  )

  const preview = loadableReferenceInfo.result?.preview.published

  const isEditing = hasFocusAtRef || !value?._ref

  // --- click outside handling
  const clickOutsideBoundaryRef = useRef<HTMLDivElement>()
  const autocompletePortalRef = useRef<HTMLDivElement>()
  const createButtonMenuPortalRef = useRef<HTMLDivElement>()
  useOnClickOutside(
    [clickOutsideBoundaryRef, autocompletePortalRef, createButtonMenuPortalRef],
    () => {
      if (hasFocusAtRef) {
        onFocus?.([])
      }
    }
  )

  return (
    <FormField
      __unstable_markers={markers}
      __unstable_presence={presence}
      __unstable_changeIndicator={false}
      inputId={inputId}
      title={type.title}
      level={level}
      description={type.description}
    >
      <Stack space={1} marginY={isEditing ? 2 : 0}>
        {isEditing ? (
          <Stack space={2} ref={clickOutsideBoundaryRef}>
            <ChangeIndicatorForFieldPath
              path={REF_PATH}
              hasFocus={focusPath?.[0] === '_ref'}
              isChanged={value?._ref !== compareValue?._ref}
            >
              <div ref={autocompletePopoverReferenceElementRef}>
                <ReferenceAutocomplete
                  data-testid="autocomplete"
                  loading={searchState.isLoading}
                  ref={focusElementRef}
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
            </ChangeIndicatorForFieldPath>
          </Stack>
        ) : (
          <ChangeIndicatorForFieldPath
            path={REF_PATH}
            hasFocus={focusPath?.[0] === '_ref'}
            isChanged={value?._ref !== compareValue?._ref}
          >
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
                    ref={focusElementRef as $TODO}
                  >
                    <PreviewReferenceValue
                      value={value}
                      referenceInfo={loadableReferenceInfo}
                      showStudioUrlIcon
                      hasStudioUrl={!!studioUrl}
                      type={type}
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
                    ref={focusElementRef}
                  >
                    <PreviewReferenceValue
                      value={value}
                      referenceInfo={loadableReferenceInfo}
                      showStudioUrlIcon
                      type={type}
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
                                onFocus?.(['_ref'])
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
                      {type.weak ? (
                        <>
                          It will not be possible to delete the "{preview?.title}"-document without
                          first removing this reference.
                        </>
                      ) : (
                        <>
                          This makes it possible to delete the "{preview?.title}"-document without
                          first deleting this reference, leaving this field referencing a
                          nonexisting document.
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
                    <Button
                      onClick={loadableReferenceInfo.retry!}
                      text={<>Retry</>}
                      tone="primary"
                    />
                  </Stack>
                </AlertStrip>
              )}
            </Card>
          </ChangeIndicatorForFieldPath>
        )}
      </Stack>
    </FormField>
  )
})
