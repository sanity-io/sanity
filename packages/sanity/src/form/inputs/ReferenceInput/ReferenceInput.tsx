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
// import {isValidationErrorMarker, Reference} from '@sanity/types'
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
import {useObservableCallback} from 'react-rx'
import {uuid} from '@sanity/uuid'
import styled from 'styled-components'
// import {ChangeIndicatorForFieldPath, FormField, PreviewCard} from '../../../components'
import {ChangeIndicator} from '../../../components/changeIndicators'
import {PreviewCard} from '../../../components/PreviewCard'
import {set, setIfMissing, unset} from '../../patch'
import {EMPTY_ARRAY} from '../../utils/empty'
// import {useDidUpdate} from '../../hooks/useDidUpdate'
import {isNonNullable} from '../../utils/isNonNullable'
import {AlertStrip} from '../../components/AlertStrip'
import {Alert} from '../../components/Alert'
import {useOnClickOutside} from '../../hooks/useOnClickOutside'
import {FIXME} from '../../types'
import {getPublishedId} from '../../../util'
import {IntentLink} from '../../../router'
import {ReferenceInputProps, CreateReferenceOption, ReferenceSearchState} from './types'
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

const INITIAL_SEARCH_STATE: ReferenceSearchState = {
  hits: [],
  isLoading: false,
}

const NO_FILTER = () => true

function nonNullable<T>(v: T): v is NonNullable<T> {
  return v !== null
}

const REF_PATH = ['_ref']
export function ReferenceInput(props: ReferenceInputProps) {
  const {
    createOptions,
    editReferenceLinkComponent: EditReferenceLink,
    focusPath = EMPTY_ARRAY,
    focused,
    path,
    getReferenceInfo,
    liveEdit,
    onChange,
    onEditReference,
    onSearch,
    selectedState,
    schemaType,
    onFocus,
    onBlur,
    changed,
    readOnly,
    onFocusPath,
    validation,
    focusRef,
    value,
    renderPreview,
  } = props

  const [searchState, setSearchState] = useState<ReferenceSearchState>(INITIAL_SEARCH_STATE)

  const handleCreateNew = useCallback(
    (option: CreateReferenceOption) => {
      const id = uuid()

      const patches = [
        setIfMissing({}),
        set(schemaType.name, ['_type']),
        set(id, ['_ref']),
        set(true, ['_weak']),
        set({type: option.type, weak: schemaType.weak, template: option.template}, [
          '_strengthenOnPublish',
        ]),
      ].filter(isNonNullable)

      onChange(patches)

      onEditReference({id, type: option.type, template: option.template})
      onFocusPath([])
    },
    [onChange, onEditReference, onFocusPath, schemaType]
  )

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
      // if there's no published version of this document, set the reference to weak

      const patches = [
        setIfMissing({}),
        set(schemaType.name, ['_type']),
        set(getPublishedId(id), ['_ref']),
        hit.published && !schemaType.weak ? unset(['_weak']) : set(true, ['_weak']),
        hit.published
          ? unset(['_strengthenOnPublish'])
          : set({type: hit?.type, weak: schemaType.weak}, ['_strengthenOnPublish']),
      ].filter(isNonNullable)

      onChange(patches)
      onFocusPath([])
    },
    [searchState.hits, schemaType.name, schemaType.weak, onChange, onFocusPath]
  )

  const handleClear = useCallback(() => {
    onChange(unset())
  }, [onChange])

  const handlePreviewKeyPress = useCallback(
    (event) => {
      if (event.key !== 'Enter' && event.key !== 'Space') {
        // enable "search for reference"-mode
        onFocusPath(['_ref'])
      }
    },
    [onFocusPath]
  )

  const handleAutocompleteKeyDown = useCallback(
    (event) => {
      // escape
      if (event.keyCode === 27) {
        onFocusPath([])
      }
    },
    [onFocusPath]
  )

  const getReferenceInfoMemo = useCallback(
    (id) => getReferenceInfo(id, schemaType),
    [getReferenceInfo, schemaType]
  )

  const loadableReferenceInfo = useReferenceInfo(value?._ref, getReferenceInfoMemo)

  const refTypeName = loadableReferenceInfo.result?.type || value?._strengthenOnPublish?.type
  const refType = refTypeName ? schemaType.to.find((toType) => toType.name === refTypeName) : null

  const autocompletePopoverReferenceElementRef = useRef<HTMLDivElement | null>(null)

  // --- focus handling
  const hasFocusAtRef = focusPath.length === 1 && focusPath[0] === '_ref'
  // todo: fixme
  const forwardedRef = useForwardedRef(focusRef)
  // useDidUpdate({hasFocusAt: hasFocusAtRef, ref: value?._ref}, (prev, current) => {
  //   const refUpdated = prev?.ref !== current.ref
  //   const focusAtUpdated = prev?.hasFocusAt !== current.hasFocusAt

  //   if ((focusAtUpdated || refUpdated) && current.hasFocusAt) {
  //     // if search mode changed and we're having focus always ensure the
  //     // ref element gets focus
  //     forwardedRef.current?.focus()
  //   }
  // })

  const weakIs = value?._weak ? 'weak' : 'strong'
  const weakShouldBe = schemaType.weak === true ? 'weak' : 'strong'

  const hasRef = Boolean(value?._ref)

  // If the reference value is marked with _strengthenOnPublish,
  // we allow weak references if the reference points to a document that has a draft but not a published
  // In all other cases we should display a "weak mismatch" warning
  const weakWarningOverride =
    hasRef && !loadableReferenceInfo.isLoading && value?._strengthenOnPublish

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(schemaType.weak === true ? set(true, ['_weak']) : unset(['_weak']))
  }, [onChange, schemaType])

  const referenceExists = hasRef && loadableReferenceInfo.result?.preview?.published?._id

  const handleRemoveStrengthenOnPublish = useCallback(() => {
    onChange([
      schemaType.weak === true ? set(true, ['_weak']) : unset(['_weak']),
      unset(['_strengthenOnPublish']),
    ])
  }, [onChange, schemaType])

  const {push} = useToast()

  const errors = useMemo(() => validation.filter((item) => item.level === 'error'), [validation])

  const pressed = selectedState === 'pressed'
  const selected = selectedState === 'selected'
  const handleFocus = useCallback(
    (event) => {
      if (onFocus && event.currentTarget === forwardedRef?.current) {
        onFocus(event)
      }
    },
    [forwardedRef, onFocus]
  )

  const handleAutocompleteFocus = useCallback(
    (event) => {
      if (onFocus && event.currentTarget === forwardedRef?.current) {
        onFocus(event)
      }
    },
    [onFocus, forwardedRef]
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
        (prevState, nextState): ReferenceSearchState => ({...prevState, ...nextState}),
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
        forwardedRef?.current?.focus()
      }
    },
    [forwardedRef]
  )

  const renderOption = useCallback(
    (option) => {
      const id = option.hit.draft?._id || option.hit.published?._id

      return (
        <StyledPreviewCard forwardedAs="button" type="button" radius={2} tone="inherit">
          <Box paddingX={3} paddingY={1}>
            <OptionPreview
              getReferenceInfo={getReferenceInfoMemo}
              id={id}
              renderPreview={renderPreview}
              type={schemaType}
            />
          </Box>
        </StyledPreviewCard>
      )
    },
    [schemaType, getReferenceInfoMemo, renderPreview]
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
    !value?._strengthenOnPublish &&
    value?._weak

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

  const handleReplaceClick = useCallback(() => {
    onFocusPath(['_ref'])
  }, [onFocusPath])

  return (
    <Stack
      space={1}
      // marginY={isEditing ? 2 : 0}
    >
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
          <ChangeIndicator path={REF_PATH} hasFocus={!!focused} isChanged={changed}>
            <AutocompleteContainer ref={autocompletePopoverReferenceElementRef}>
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
          </ChangeIndicator>
        </Stack>
      ) : (
        <ChangeIndicator path={path} hasFocus={!!focused} isChanged={changed}>
          <Card
            border
            radius={1}
            tone={
              readOnly
                ? 'transparent'
                : loadableReferenceInfo.error || errors.length > 0
                ? 'critical'
                : 'inherit'
            }
          >
            <Flex align="center" padding={1}>
              <StyledPreviewCard
                __unstable_focusRing
                forwardedAs={EditReferenceLink as FIXME} // @todo: fix typing
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
                ref={forwardedRef}
                selected={selected}
                tabIndex={0}
                tone={selected ? 'default' : 'inherit'}
              >
                <PreviewReferenceValue
                  referenceInfo={loadableReferenceInfo}
                  renderPreview={renderPreview}
                  type={schemaType}
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
                            onClick={handleReplaceClick}
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
                title={schemaType.weak ? 'Finalize reference' : 'Convert to strong reference'}
                status="info"
                data-testid="alert-reference-published"
              >
                <Stack space={3}>
                  <Text as="p" muted size={1}>
                    <strong>{loadableReferenceInfo.result?.preview.published?.title}</strong> is
                    published and this reference should now be{' '}
                    {schemaType.weak ? <>finalized</> : <>converted to a strong reference</>}.
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
