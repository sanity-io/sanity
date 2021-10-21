/* eslint-disable complexity */
/* eslint-disable max-nested-callbacks,no-nested-ternary */
import React, {
  ComponentProps,
  ForwardedRef,
  forwardRef,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {isValidationErrorMarker, Marker, Path, Reference, ReferenceSchemaType} from '@sanity/types'
import {
  AddIcon,
  CloseIcon as ClearIcon,
  EllipsisVerticalIcon,
  LaunchIcon as OpenInNewTabIcon,
  SyncIcon as ReplaceIcon,
} from '@sanity/icons'
import {concat, Observable, of} from 'rxjs'
import {useId} from '@reach/auto-id'
import {catchError, distinctUntilChanged, filter, map, scan, switchMap, tap} from 'rxjs/operators'
import {
  Autocomplete,
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
  TextSkeleton,
  useForwardedRef,
  useToast,
} from '@sanity/ui'
import {ChangeIndicatorForFieldPath, FormField, IntentLink} from '@sanity/base/components'
import {FormFieldPresence} from '@sanity/base/presence'
import {getPublishedId, AvailabilityReason} from '@sanity/base/_internal'
import {useObservableCallback} from 'react-rx'
import {uuid} from '@sanity/uuid'
import styled from 'styled-components'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import {Alert} from '../../components/Alert'
import {Details} from '../../components/Details'
import {EMPTY_ARRAY} from '../../utils/empty'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {PreviewComponentType, ReferenceInfo, SearchFunction, SearchState} from './types'
import {OptionPreview} from './OptionPreview'
import {useReferenceInfo} from './useReferenceInfo'

const INITIAL_SEARCH_STATE: SearchState = {
  hits: [],
  isLoading: false,
}

export interface Props {
  value?: Reference
  type: ReferenceSchemaType
  markers: Marker[]
  suffix?: ReactNode
  focusPath: Path
  readOnly?: boolean
  onSearch: SearchFunction
  compareValue?: Reference
  onFocus?: (path: Path) => void
  onBlur?: () => void
  selectedState?: 'selected' | 'pressed' | 'none'
  editReferenceLinkComponent: React.ComponentType
  onEditReference: (id: string, type: ReferenceSchemaType) => void
  getReferenceInfo: (id: string, type: ReferenceSchemaType) => Observable<ReferenceInfo>
  previewComponent: PreviewComponentType
  onChange: (event: PatchEvent) => void
  level: number
  presence: FormFieldPresence[]
}

const NO_FILTER = () => true

function nonNullable<T>(v: T): v is NonNullable<T> {
  return v !== null
}

// workaround for an issue that caused the autocomplete to not be the same height as the New button
// after removing, make sure they align
const WorkaroundForHeightIssue = styled.div`
  line-height: 0;
`

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
    onSearch,
    onChange,
    presence,
    focusPath = EMPTY_ARRAY,
    onFocus,
    onBlur,
    selectedState,
    editReferenceLinkComponent: EditReferenceLink,
    onEditReference,
    compareValue,
    getReferenceInfo,
    previewComponent: PreviewComponent,
  } = props

  const [searchState, setSearchState] = useState<SearchState>(INITIAL_SEARCH_STATE)

  const [searchMode, setSearchMode] = useState(false)

  const handleCreateNew = (refType) => {
    const id = uuid()

    const patches = [
      setIfMissing({}),
      set(type.name, ['_type']),
      set(id, ['_ref']),
      set(true, ['_weak']),
      !type.weak && set({type: refType.name}, ['_strengthenOnPublish']),
    ].filter(Boolean)

    onChange(PatchEvent.from(patches))

    setSearchMode(false)

    onEditReference(id, refType)
  }

  const handleClear = useCallback(() => {
    // note: we can't simply unset here because the value might be in an array and that would cause
    // the item to be removed, and as a consequence the edit dialog will be closed
    onChange(PatchEvent.from(unset()))
  }, [onChange])

  const handlePreviewKeyPress = useCallback((event) => {
    if (event.key !== 'Enter' && event.key !== 'Space') {
      // enable "search for reference"-mode
      setSearchMode(true)
    }
  }, [])

  const handleAutocompleteKeyDown = useCallback((event) => {
    // escape
    if (event.keyCode === 27) {
      setSearchMode(false)
    }
  }, [])

  const getReferenceInfoMemo = useCallback((id) => getReferenceInfo(id, type), [
    getReferenceInfo,
    type,
  ])

  const {
    isLoading: isReferenceInfoLoading,
    error: referenceInfoLoadError,
    retry: retryLoadReference,
    result: referenceInfo,
  } = useReferenceInfo(value?._ref, getReferenceInfoMemo)

  const refTypeName = referenceInfo?.type || value?._strengthenOnPublish?.type

  const refType = refTypeName && type.to.find((toType) => toType.name === refTypeName)

  const handleChange = useCallback(
    (id: string) => {
      if (!id) {
        handleClear()
        return
      }

      const hit = searchState.hits.find((h) => h.id === id)

      // if there's no published version of this document, set the reference to weak
      const unpublished = hit && !hit.published

      const patches = [
        setIfMissing({}),
        set(type.name, ['_type']),
        set(getPublishedId(id), ['_ref']),
        set(unpublished, ['_weak']),
        !type.weak && unpublished && set({type: refType.name}, ['_strengthenOnPublish']),
      ].filter(Boolean)

      onChange(PatchEvent.from(patches))
    },
    [searchState.hits, type.name, type.weak, refType?.name, onChange, handleClear]
  )

  const ref = useForwardedRef(forwardedRef)
  const hasFocusAt = focusPath.length === 1 && focusPath[0] === '_ref'

  useDidUpdate({hasFocusAt: hasFocusAt, ref: value?._ref}, (prev, current) => {
    const valueUpdated = prev?.ref !== current?.ref
    if (valueUpdated || (prev.hasFocusAt && !current.hasFocusAt)) {
      // always exit search mode after value?._ref changed
      setSearchMode(false)
    }
  })

  useDidUpdate({searchMode, hasFocusAt, ref: value?._ref}, (prev, current) => {
    const searchModeUpdated = prev.searchMode !== current.searchMode
    const refUpdated = prev.ref !== current.ref
    const focusAtUpdated = prev.hasFocusAt !== current.hasFocusAt

    if ((searchModeUpdated || focusAtUpdated || refUpdated) && current.hasFocusAt) {
      // if search mode changed and we're having focus always ensure the
      // ref element gets focus
      ref.current?.focus()
    }
  })

  const weakIs = value?._weak ? 'weak' : 'strong'
  const weakShouldBe = type.weak === true ? 'weak' : 'strong'

  const hasRef = Boolean(value?._ref)

  const refDocumentExists =
    hasRef &&
    !isReferenceInfoLoading &&
    (referenceInfo?.draft.availability.reason !== AvailabilityReason.NOT_FOUND ||
      referenceInfo?.published.availability.reason !== AvailabilityReason.NOT_FOUND)

  const hasInsufficientPermissions =
    hasRef &&
    !isReferenceInfoLoading &&
    refDocumentExists &&
    referenceInfo?.draft.availability.reason === AvailabilityReason.PERMISSION_DENIED &&
    referenceInfo?.published.availability.reason === AvailabilityReason.PERMISSION_DENIED

  // If the reference value is marked with _strengthenOnPublish,
  // we allow weak references if the reference points to a document that has a draft but not a published
  // In all other cases we should display a "weak mismatch" warning
  const weakWarningOverride = hasRef && !isReferenceInfoLoading && value._strengthenOnPublish

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(PatchEvent.from(type.weak === true ? set(true, ['_weak']) : unset(['_weak'])))
  }, [onChange, type])

  const {push} = useToast()

  const errors = useMemo(() => markers.filter(isValidationErrorMarker), [markers])

  const pressed = selectedState === 'pressed'
  const selected = selectedState === 'selected'
  const handleFocus = useCallback(
    (event) => {
      if (onFocus && event.currentTarget === ref.current) {
        onFocus(['_ref'])
      }
    },
    [onFocus, ref]
  )

  const handleQueryChange = useObservableCallback((inputValue$: Observable<string | null>) => {
    return inputValue$.pipe(
      distinctUntilChanged(),
      filter(nonNullable),
      switchMap((searchString) =>
        concat(
          of({isLoading: true}),
          onSearch(searchString).pipe(
            map((hits) => ({hits, isLoading: false})),
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

  const preview = referenceInfo?.draft.preview || referenceInfo?.published.preview

  const showWeakRefMismatch =
    !isReferenceInfoLoading && hasRef && weakIs !== weakShouldBe && !weakWarningOverride

  const inputId = useId()

  const rootRef = useRef()

  const handleCreateButtonKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        ref.current?.focus()
      }
    },
    [ref]
  )

  const renderOption = useCallback(
    (option) => {
      const id = option.hit.draft?._id || option.hit.published?._id
      return (
        <Card as="button" type="button" radius={2}>
          <Box paddingX={3} paddingY={1}>
            <OptionPreview
              type={type}
              id={id}
              getReferenceInfo={getReferenceInfoMemo}
              previewComponent={PreviewComponent}
            />
          </Box>
        </Card>
      )
    },
    [type, getReferenceInfoMemo, PreviewComponent]
  )

  const OpenLink = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function OpenLink(
        restProps: ComponentProps<typeof IntentLink>,
        _ref: ForwardedRef<HTMLAnchorElement>
      ) {
        return (
          <IntentLink
            {...restProps}
            intent="edit"
            params={{id: value?._ref, type: refType?.name}}
            target="_blank"
            rel="noopener noreferrer"
            ref={_ref}
          />
        )
      }),
    [refType?.name, value?._ref]
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
      <Stack space={3} ref={rootRef}>
        {hasInsufficientPermissions && (
          <Alert
            data-testid="alert-insufficient-permissions"
            title="Insufficient permissions to access this reference"
            status="warning"
          >
            <Text as="p" muted size={1}>
              You don't have access to the referenced document. Please contact an admin for access
              or remove this reference.
            </Text>
          </Alert>
        )}

        {showWeakRefMismatch && (
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
            data-testid="alert-reference-strength-mismatch"
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
                      be possible to delete the "{preview?.title}"-document without first removing
                      this reference.
                    </>
                  ) : (
                    <>
                      This reference is currently marked as a <em>weak reference</em>. This makes it
                      possible to delete the "{preview?.title}"-document without first deleting this
                      reference, leaving this field referencing a nonexisting document.
                    </>
                  )}
                </Text>
              </Stack>
            </Details>
          </Alert>
        )}
        {referenceInfoLoadError ? (
          <Alert
            title="Load error"
            status="warning"
            data-testid="alert-load-error"
            suffix={
              <Stack padding={2}>
                <Button onClick={retryLoadReference} text="Try again" />
              </Stack>
            }
          >
            <Text as="p" muted size={1}>
              Unable to load referenced document
            </Text>
            <Details marginTop={4} title={<>Developer info</>}>
              <Stack space={3}>
                <Text muted size={1} textOverflow="ellipsis">
                  <pre>{referenceInfoLoadError.stack}</pre>
                </Text>
              </Stack>
            </Details>
          </Alert>
        ) : (
          !isReferenceInfoLoading &&
          value &&
          !refDocumentExists &&
          !weakWarningOverride && (
            <Alert
              title="Nonexistent document reference"
              status="warning"
              data-testid="alert-nonexistent-document"
            >
              <Text as="p" muted size={1}>
                This field is currently referencing a document that doesn't exist (ID:{' '}
                <code>{value._ref}</code>). You can either remove the reference or replace it with
                an existing document.
              </Text>
            </Alert>
          )
        )}
        {searchMode || !value?._ref ? (
          <Card marginY={2}>
            <Flex align="center">
              <Box flex={2}>
                <ChangeIndicatorForFieldPath
                  path={REF_PATH}
                  hasFocus={focusPath?.[0] === '_ref'}
                  isChanged={value?._ref !== compareValue?._ref}
                >
                  <WorkaroundForHeightIssue>
                    <Autocomplete
                      data-testid="autocomplete"
                      loading={searchState.isLoading}
                      ref={ref}
                      id={inputId || ''}
                      options={searchState.hits.map((hit) => ({
                        value: hit.id,
                        hit: hit,
                      }))}
                      onFocus={handleFocus}
                      onBlur={onBlur}
                      radius={1}
                      placeholder="Type to search"
                      onKeyDown={handleAutocompleteKeyDown}
                      readOnly={readOnly}
                      disabled={isReferenceInfoLoading}
                      onQueryChange={handleQueryChange}
                      onChange={handleChange}
                      filterOption={NO_FILTER}
                      renderOption={renderOption}
                      openButton={{onClick: handleAutocompleteOpenButtonClick}}
                    />
                  </WorkaroundForHeightIssue>
                </ChangeIndicatorForFieldPath>
              </Box>
              {!readOnly && (
                <Box marginLeft={2}>
                  <Inline space={2}>
                    {type.to.length > 1 ? (
                      <MenuButton
                        button={
                          <Button
                            text="Create new…"
                            mode="ghost"
                            icon={AddIcon}
                            onKeyDown={handleCreateButtonKeyDown}
                          />
                        }
                        id={`${inputId}-selectTypeMenuButton`}
                        menu={
                          <Menu>
                            {type.to.map((toType) => (
                              <MenuItem
                                key={toType.name}
                                text={toType.title}
                                icon={toType.icon}
                                onClick={() => handleCreateNew(toType)}
                              />
                            ))}
                          </Menu>
                        }
                        placement="right"
                        popover={{portal: true, tone: 'default'}}
                      />
                    ) : (
                      <Button
                        text="Create new"
                        mode="ghost"
                        onKeyDown={handleCreateButtonKeyDown}
                        onClick={() => handleCreateNew(type.to[0])}
                        icon={AddIcon}
                      />
                    )}
                  </Inline>
                </Box>
              )}
            </Flex>
          </Card>
        ) : (
          <>
            <ChangeIndicatorForFieldPath
              path={REF_PATH}
              hasFocus={focusPath?.[0] === '_ref'}
              isChanged={value?._ref !== compareValue?._ref}
              disabled={!value?._ref}
            >
              <Card
                padding={1}
                shadow={1}
                radius={1}
                tone={
                  readOnly
                    ? 'transparent'
                    : referenceInfoLoadError || errors.length > 0
                    ? 'critical'
                    : 'default'
                }
              >
                <Flex align="center">
                  <Card
                    flex={1}
                    padding={1}
                    radius={2}
                    as={EditReferenceLink}
                    //@ts-expect-error issue with styled components "as" polymorphism
                    documentId={value?._ref}
                    documentType={refType?.name}
                    data-as="a"
                    tone="inherit"
                    __unstable_focusRing
                    tabIndex={0}
                    selected={selected}
                    pressed={pressed}
                    onKeyPress={handlePreviewKeyPress}
                    onFocus={handleFocus}
                    data-selected={selected ? true : undefined}
                    data-pressed={pressed ? true : undefined}
                    ref={ref}
                  >
                    {isReferenceInfoLoading ? (
                      <Stack space={2} padding={1}>
                        <TextSkeleton
                          style={{maxWidth: 320}}
                          radius={1}
                          animated={!referenceInfoLoadError}
                        />
                        <TextSkeleton
                          style={{maxWidth: 200}}
                          radius={1}
                          size={1}
                          animated={!referenceInfoLoadError}
                        />
                      </Stack>
                    ) : !refType && referenceInfo?.type ? (
                      <Stack space={2} padding={2}>
                        The referenced document is of invalid type: ({referenceInfo?.type})
                      </Stack>
                    ) : (
                      <PreviewComponent
                        referenceInfo={referenceInfo}
                        refType={refType}
                        showTypeLabel={type.to.length > 1}
                        __workaround_selected={selected}
                      />
                    )}
                  </Card>
                  <Inline paddingRight={1}>
                    <MenuButton
                      button={<Button padding={3} mode="bleed" icon={EllipsisVerticalIcon} />}
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
                                  setSearchMode(true)
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
              </Card>
            </ChangeIndicatorForFieldPath>
          </>
        )}
      </Stack>
    </FormField>
  )
})
