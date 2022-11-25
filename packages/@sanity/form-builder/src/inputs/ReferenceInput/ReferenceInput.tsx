/* eslint-disable complexity */
/* eslint-disable max-nested-callbacks,no-nested-ternary */
import React, {
  ComponentProps,
  ForwardedRef,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {isValidationErrorMarker, Reference} from '@sanity/types'
import {
  EllipsisVerticalIcon,
  LaunchIcon as OpenInNewTabIcon,
  ResetIcon as ClearIcon,
  SyncIcon as ReplaceIcon,
} from '@sanity/icons'
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
  MenuDivider,
  MenuItem,
  Stack,
  Text,
  useForwardedRef,
  useToast,
} from '@sanity/ui'
import {
  ChangeIndicatorForFieldPath,
  FormField,
  IntentLink,
  PreviewCard,
} from '@sanity/base/components'
import {getPublishedId} from '@sanity/base/_internal'
import {useObservableCallback} from 'react-rx'
import {uuid} from '@sanity/uuid'
import styled from 'styled-components'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import {EMPTY_ARRAY} from '../../utils/empty'
import {useDidUpdate} from '../../hooks/useDidUpdate'

import {isNonNullable} from '../../utils/isNonNullable'
import {AlertStrip} from '../../AlertStrip'
import {Alert} from '../../components/Alert'
import {useOnClickOutside} from '../../hooks/useOnClickOutside'
import {BaseInputProps, CreateOption, SearchState} from './types'
import {OptionPreview} from './OptionPreview'
import {useReferenceInfo} from './useReferenceInfo'
import {PreviewReferenceValue} from './PreviewReferenceValue'
import {CreateButton} from './CreateButton'
import {ReferenceAutocomplete} from './ReferenceAutocomplete'
import {AutocompleteContainer} from './AutocompleteContainer'

const StyledPreviewCard = styled(PreviewCard)`
  /* this is a hack to avoid layout jumps while previews are loading
  there's probably better ways of solving this */
  min-height: 36px;
`

const INITIAL_SEARCH_STATE: SearchState = {
  hits: [],
  isLoading: false,
}

export interface Props extends BaseInputProps {
  value?: Reference
}

const NO_FILTER = () => true

function nonNullable<T>(v: T): v is NonNullable<T> {
  return v !== null
}

const REF_PATH = ['_ref']
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
    liveEdit,
    onSearch,
    onChange,
    presence,
    focusPath = EMPTY_ARRAY,
    onFocus,
    onBlur,
    selectedState,
    editReferenceLinkComponent: EditReferenceLink,
    onEditReference,
    createOptions,
    compareValue,
    getReferenceInfo,
  } = props

  const [searchState, setSearchState] = useState<SearchState>(INITIAL_SEARCH_STATE)

  const handleCreateNew = (option: CreateOption) => {
    const id = uuid()

    const patches = [
      setIfMissing({}),
      set(type.name, ['_type']),
      set(id, ['_ref']),
      set(true, ['_weak']),
      set({type: option.type, weak: type.weak, template: option.template}, [
        '_strengthenOnPublish',
      ]),
    ].filter(isNonNullable)

    onChange(PatchEvent.from(patches))

    onEditReference({id, type: option.type, template: option.template})
    onFocus?.([])
  }

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
      // if there's no published version of this document, set the reference to weak

      const patches = [
        setIfMissing({}),
        set(type.name, ['_type']),
        set(getPublishedId(id), ['_ref']),
        hit.published && !type.weak ? unset(['_weak']) : set(true, ['_weak']),
        hit.published
          ? unset(['_strengthenOnPublish'])
          : set({type: hit?.type, weak: type.weak}, ['_strengthenOnPublish']),
      ].filter(isNonNullable)

      onChange(PatchEvent.from(patches))
      onFocus?.([])
    },
    [searchState.hits, type.name, type.weak, onChange, onFocus]
  )

  const handleClear = useCallback(() => {
    onChange(PatchEvent.from(unset()))
  }, [onChange])

  const handlePreviewKeyPress = useCallback(
    (event) => {
      if (event.key !== 'Enter' && event.key !== 'Space') {
        // enable "search for reference"-mode
        onFocus?.(['_ref'])
      }
    },
    [onFocus]
  )

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

  const loadableReferenceInfo = useReferenceInfo(value?._ref, getReferenceInfoMemo)

  const refTypeName = loadableReferenceInfo.result?.type || value?._strengthenOnPublish?.type
  const refType = refTypeName ? type.to.find((toType) => toType.name === refTypeName) : null

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

  // If the reference value is marked with _strengthenOnPublish,
  // we allow weak references if the reference points to a document that has a draft but not a published
  // In all other cases we should display a "weak mismatch" warning
  const weakWarningOverride =
    hasRef && !loadableReferenceInfo.isLoading && value?._strengthenOnPublish

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(PatchEvent.from(type.weak === true ? set(true, ['_weak']) : unset(['_weak'])))
  }, [onChange, type])

  const referenceExists = hasRef && loadableReferenceInfo.result?.preview?.published?._id

  const handleRemoveStrengthenOnPublish = useCallback(() => {
    onChange(
      PatchEvent.from([
        type.weak === true ? set(true, ['_weak']) : unset(['_weak']),
        unset(['_strengthenOnPublish']),
      ])
    )
  }, [onChange, type])

  const {push} = useToast()

  const errors = useMemo(() => markers.filter(isValidationErrorMarker), [markers])

  const pressed = selectedState === 'pressed'
  const selected = selectedState === 'selected'
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
      //This prevents a filter in a reference from updating when the dependent reference are updated.
      //Worst case by removing - the function will be called when you enter the same string.
      //distinctUntilChanged(),
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

  const showWeakRefMismatch =
    !loadableReferenceInfo.isLoading && hasRef && weakIs !== weakShouldBe && !weakWarningOverride

  const inputId = useId()

  const handleCreateButtonKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        focusElementRef.current?.focus()
      }
    },
    [focusElementRef]
  )

  const renderOption = useCallback(
    (option) => {
      const id = option.hit.draft?._id || option.hit.published?._id

      return (
        <StyledPreviewCard forwardedAs="button" type="button" radius={2}>
          <Box paddingX={3} paddingY={1}>
            <OptionPreview getReferenceInfo={getReferenceInfoMemo} id={id} type={type} />
          </Box>
        </StyledPreviewCard>
      )
    },
    [type, getReferenceInfoMemo]
  )

  const OpenLink = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function OpenLink(
        restProps: ComponentProps<typeof IntentLink>,
        _ref: ForwardedRef<HTMLAnchorElement>
      ) {
        const template = (value?._strengthenOnPublish || {}).template
        return (
          <IntentLink
            {...restProps}
            intent="edit"
            params={[
              {id: value?._ref, type: refType?.name, template: template?.id},
              {params: template?.params},
            ]}
            target="_blank"
            rel="noopener noreferrer"
            ref={_ref}
          />
        )
      }),
    [refType?.name, value?._ref, value?._strengthenOnPublish]
  )

  const preview =
    loadableReferenceInfo.result?.preview.draft || loadableReferenceInfo.result?.preview.published

  const isWeakRefToNonexistent =
    loadableReferenceInfo?.result?.availability?.reason === 'NOT_FOUND' &&
    !value._strengthenOnPublish &&
    value._weak

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
      <Stack space={1}>
        {isEditing || isWeakRefToNonexistent ? (
          <Stack space={2} ref={clickOutsideBoundaryRef}>
            {isWeakRefToNonexistent ? (
              <Alert
                data-testid="alert-nonexistent-document"
                title="Nonexistent document reference"
                suffix={
                  <Stack padding={2}>
                    <Button text="Clear" onClick={handleClear} />
                  </Stack>
                }
              >
                <Text size={1}>
                  This field is currently referencing a document that doesn't exist (ID:
                  <code>{value._ref}</code>). You can either remove the reference or replace it with
                  another document.
                </Text>
              </Alert>
            ) : null}
            <ChangeIndicatorForFieldPath
              path={REF_PATH}
              hasFocus={focusPath?.[0] === '_ref'}
              isChanged={value?._ref !== compareValue?._ref}
            >
              <AutocompleteContainer ref={autocompletePopoverReferenceElementRef}>
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
                {!readOnly && createOptions.length > 0 && (
                  <CreateButton
                    id={`${inputId}-selectTypeMenuButton`}
                    createOptions={createOptions}
                    onCreate={handleCreateNew}
                    onKeyDown={handleCreateButtonKeyDown}
                    menuRef={createButtonMenuPortalRef}
                  />
                )}
              </AutocompleteContainer>
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
                <StyledPreviewCard
                  __unstable_focusRing
                  forwardedAs={EditReferenceLink}
                  data-as="a"
                  data-pressed={pressed ? true : undefined}
                  data-selected={selected ? true : undefined}
                  documentId={value?._ref}
                  documentType={refType?.name}
                  flex={1}
                  onFocus={handleFocus}
                  onKeyPress={handlePreviewKeyPress}
                  padding={1}
                  paddingRight={3}
                  pressed={pressed}
                  radius={2}
                  ref={focusElementRef}
                  selected={selected}
                  tabIndex={0}
                  tone={selected ? 'default' : 'inherit'}
                >
                  <PreviewReferenceValue
                    referenceInfo={loadableReferenceInfo}
                    type={type}
                    value={value}
                  />
                </StyledPreviewCard>
                <Inline paddingX={1}>
                  <MenuButton
                    button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
                    id={`${inputId}-menuButton`}
                    menu={
                      <Menu>
                        {!readOnly && (
                          <>
                            <MenuItem
                              text="Clear"
                              tone="critical"
                              icon={ClearIcon}
                              onClick={handleClear}
                            />
                            <MenuItem
                              text="Replace"
                              icon={ReplaceIcon}
                              onClick={() => {
                                onFocus?.(['_ref'])
                              }}
                            />
                            <MenuDivider />
                          </>
                        )}

                        <MenuItem
                          as={OpenLink}
                          data-as="a"
                          text="Open in new tab"
                          icon={OpenInNewTabIcon}
                        />
                      </Menu>
                    }
                    placement="right"
                    popover={{portal: true, tone: 'default'}}
                  />
                </Inline>
              </Flex>
              {liveEdit && referenceExists && value._strengthenOnPublish && (
                <AlertStrip
                  padding={1}
                  title={type.weak ? 'Finalize reference' : 'Convert to strong reference'}
                  status="info"
                  data-testid="alert-reference-published"
                >
                  <Stack space={3}>
                    <Text as="p" muted size={1}>
                      <strong>{loadableReferenceInfo.result.preview.published.title}</strong> is
                      published and this reference should now be{' '}
                      {type.weak ? <>finalized</> : <>converted to a strong reference</>}.
                    </Text>
                    <Button
                      onClick={handleRemoveStrengthenOnPublish}
                      text={<>Convert to strong reference</>}
                      tone="positive"
                    />
                  </Stack>
                </AlertStrip>
              )}
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
