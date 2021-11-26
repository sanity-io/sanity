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
import {isValidationErrorMarker, isValidationMarker, Reference} from '@sanity/types'
import {
  EllipsisVerticalIcon,
  LaunchIcon as OpenInNewTabIcon,
  SyncIcon as ReplaceIcon,
  TrashIcon,
} from '@sanity/icons'
import {concat, Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, filter, map, scan, switchMap, tap} from 'rxjs/operators'
import {
  Badge,
  Box,
  Button,
  Card,
  CardTone,
  Flex,
  Inline,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Stack,
  Text,
  Tooltip,
  useForwardedRef,
  useToast,
} from '@sanity/ui'
import {FormField, FormFieldValidationStatus, IntentLink} from '@sanity/base/components'
import {FieldPresence} from '@sanity/base/presence'
import {getPublishedId} from '@sanity/base/_internal'
import {useObservableCallback} from 'react-rx'
import {uuid} from '@sanity/uuid'
import {useId} from '@reach/auto-id'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import {EMPTY_ARRAY} from '../../utils/empty'
import {useDidUpdate} from '../../hooks/useDidUpdate'

import {isNonNullable} from '../../utils/isNonNullable'
import {AlertStrip} from '../../AlertStrip'
import {RowWrapper} from '../arrays/ArrayOfObjectsInput/item/components/RowWrapper'
import {DragHandle} from '../arrays/common/DragHandle'
import {BaseInputProps, CreateOption, SearchState} from './types'
import {OptionPreview} from './OptionPreview'
import {useReferenceInfo} from './useReferenceInfo'
import {PreviewReferenceValue} from './PreviewReferenceValue'
import {CreateButton} from './CreateButton'
import {ReferenceAutocomplete} from './ReferenceAutocomplete'
import {AutocompleteContainer} from './AutocompleteContainer'
import {useOnClickOutside} from './utils/useOnClickOutside'
import {PreviewCard} from './PreviewCard'

const INITIAL_SEARCH_STATE: SearchState = {
  hits: [],
  isLoading: false,
}

export interface Props extends BaseInputProps {
  value: OptionalRef
  isSortable: boolean
}

const NO_FILTER = () => true

const dragHandle = <DragHandle paddingX={1} paddingY={3} />

type PartialPick<T, K extends keyof T> = Omit<T, K> &
  {
    [P in K]?: T[K]
  }

type OptionalRef = PartialPick<Reference, '_ref'>

function valueHasRef<T extends {_ref?: string}>(value: T): value is T & {_ref: string} {
  return typeof value._ref === 'string'
}

export const ArrayItemReferenceInput = forwardRef(function ReferenceInput(
  props: Props,
  forwardedRef: ForwardedRef<HTMLInputElement>
) {
  const {
    type,
    value,
    markers,
    readOnly,
    onSearch,
    onChange,
    focusPath = EMPTY_ARRAY,
    onFocus,
    presence,
    createOptions,
    isSortable,
    level,
    onBlur,
    selectedState,
    editReferenceLinkComponent: EditReferenceLink,
    onEditReference,
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
    ]

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

  const handleCancelEdit = useCallback(() => {
    if (!value?._ref) {
      onChange(PatchEvent.from(unset()))
    }
    onFocus?.([])
  }, [onChange, onFocus, value?._ref])

  const handleAutocompleteKeyDown = useCallback(
    (event) => {
      // escape
      if (event.keyCode === 27) {
        handleCancelEdit()
      }
    },
    [handleCancelEdit]
  )

  const getReferenceInfoMemo = useCallback((id) => getReferenceInfo(id, type), [
    getReferenceInfo,
    type,
  ])

  const loadableReferenceInfo = useReferenceInfo(value?._ref, getReferenceInfoMemo)

  const refTypeName = loadableReferenceInfo.result?.type || value?._strengthenOnPublish?.type

  const refType = refTypeName ? type.to.find((toType) => toType.name === refTypeName) : undefined

  // --- focus handling
  const hasFocusAtRef = focusPath.length === 1 && (focusPath[0] === '_ref' || focusPath[0] === '$')
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

  const hasRef = valueHasRef(value)
  // If the reference value is marked with _strengthenOnPublish,
  // we allow weak references if the reference points to a document that has a draft but not a published
  // In all other cases we should display a "weak mismatch" warning
  const weakWarningOverride =
    hasRef && !loadableReferenceInfo.isLoading && value?._strengthenOnPublish

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(PatchEvent.from(type.weak === true ? set(true, ['_weak']) : unset(['_weak'])))
  }, [onChange, type])

  const {push} = useToast()

  const validation = useMemo(() => markers.filter(isValidationMarker), [markers])
  const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

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
      distinctUntilChanged(),
      filter(isNonNullable),
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
        <Card as="button" type="button" radius={2}>
          <Box paddingX={3} paddingY={1}>
            <OptionPreview type={type} id={id} getReferenceInfo={getReferenceInfoMemo} />
          </Box>
        </Card>
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

  const isEditing = hasFocusAtRef

  // --- click outside handling
  const clickOutsideBoundaryRef = useRef<HTMLDivElement>()
  const autocompletePortalRef = useRef<HTMLDivElement>()
  const createButtonMenuPortalRef = useRef<HTMLDivElement>()
  useOnClickOutside(
    [clickOutsideBoundaryRef, autocompletePortalRef, createButtonMenuPortalRef],
    () => {
      if (isEditing) {
        handleCancelEdit()
      }
    }
  )

  const autocompletePopoverReferenceElementRef = useRef()

  return (
    <RowWrapper
      radius={2}
      padding={1}
      tone={
        (isEditing
          ? ' default'
          : readOnly
          ? 'transparent'
          : loadableReferenceInfo.error || errors.length > 0
          ? 'critical'
          : showWeakRefMismatch
          ? 'caution'
          : 'default') as CardTone
      }
    >
      <Flex align="center">
        {!isEditing && isSortable && !readOnly && (
          <Card className="dragHandle" tone="inherit" marginRight={1}>
            {dragHandle}
          </Card>
        )}

        {isEditing ? (
          <Box flex={1} padding={1} ref={clickOutsideBoundaryRef}>
            <FormField
              __unstable_markers={markers}
              __unstable_presence={presence}
              __unstable_changeIndicator={false}
              inputId={inputId}
              title={type.title}
              level={level}
              description={type.description}
            >
              <AutocompleteContainer ref={autocompletePopoverReferenceElementRef}>
                <ReferenceAutocomplete
                  data-testid="autocomplete"
                  loading={searchState.isLoading}
                  portalRef={autocompletePortalRef}
                  ref={focusElementRef}
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
                  onChange={handleChange}
                  referenceElement={autocompletePopoverReferenceElementRef.current}
                  filterOption={NO_FILTER}
                  renderOption={renderOption}
                  openButton={{onClick: handleAutocompleteOpenButtonClick}}
                />
                {!readOnly && createOptions.length > 0 && (
                  <CreateButton
                    menuRef={createButtonMenuPortalRef}
                    id={`${inputId}-selectTypeMenuButton`}
                    createOptions={createOptions}
                    onCreate={handleCreateNew}
                    onKeyDown={handleCreateButtonKeyDown}
                  />
                )}
              </AutocompleteContainer>
            </FormField>
          </Box>
        ) : (
          <Box flex={1}>
            <Flex align="center">
              {hasRef ? (
                <PreviewCard
                  flex={1}
                  padding={1}
                  paddingRight={3}
                  radius={2}
                  forwardedAs={EditReferenceLink}
                  documentId={value?._ref}
                  documentType={refType?.name}
                  data-as="a"
                  tone={selected ? 'default' : 'inherit'}
                  __unstable_focusRing
                  tabIndex={0}
                  selected={selected}
                  pressed={pressed}
                  onKeyPress={handlePreviewKeyPress}
                  onFocus={handleFocus}
                  data-selected={selected ? true : undefined}
                  data-pressed={pressed ? true : undefined}
                  ref={focusElementRef}
                >
                  <PreviewReferenceValue
                    value={value}
                    referenceInfo={loadableReferenceInfo}
                    type={type}
                    selected={selected}
                  />
                </PreviewCard>
              ) : (
                <Card
                  flex={1}
                  padding={3}
                  marginRight={1}
                  radius={2}
                  tone="inherit"
                  as="button"
                  __unstable_focusRing
                  tabIndex={0}
                  onClick={() => onFocus?.(['_ref'])}
                  ref={focusElementRef}
                >
                  <Box marginY={1}>
                    <Text muted>Empty reference</Text>
                  </Box>
                </Card>
              )}
              <Inline>
                {!readOnly && presence.length > 0 && (
                  <Box marginLeft={1}>
                    <FieldPresence presence={presence} maxAvatars={1} />
                  </Box>
                )}
                {validation.length > 0 && (
                  <Box marginLeft={1} paddingX={1} paddingY={3}>
                    <FormFieldValidationStatus __unstable_markers={validation} />
                  </Box>
                )}
                {!value._key && (
                  <Box marginLeft={1}>
                    <Tooltip
                      content={
                        <Box padding={2}>
                          <Text muted size={1}>
                            This item is missing the required <code>_key</code> property.
                          </Text>
                        </Box>
                      }
                      placement="top"
                    >
                      <Badge mode="outline" tone="caution">
                        Missing key
                      </Badge>
                    </Tooltip>
                  </Box>
                )}
              </Inline>
            </Flex>
          </Box>
        )}
        {!isEditing && (
          <Box marginLeft={1}>
            <MenuButton
              button={<Button paddingY={3} paddingX={2} mode="bleed" icon={EllipsisVerticalIcon} />}
              id={`${inputId}-menuButton`}
              menu={
                <Menu>
                  {!readOnly && (
                    <>
                      <MenuItem
                        text="Remove"
                        tone="critical"
                        icon={TrashIcon}
                        onClick={handleClear}
                      />
                      <MenuItem
                        text="Replace"
                        icon={ReplaceIcon}
                        onClick={() => {
                          onFocus?.(['_ref'])
                        }}
                      />
                    </>
                  )}
                  {!readOnly && hasRef && <MenuDivider />}
                  {hasRef && (
                    <MenuItem
                      as={OpenLink}
                      data-as="a"
                      text="Open in new tab"
                      icon={OpenInNewTabIcon}
                    />
                  )}
                </Menu>
              }
              placement="right"
              popover={{portal: true, tone: 'default'}}
            />
          </Box>
        )}
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
              This reference is <em>{weakIs}</em>, but according to the current schema it should be{' '}
              <em>{weakShouldBe}.</em>
            </Text>

            <Text as="p" muted size={1}>
              {type.weak ? (
                <>
                  It will not be possible to delete the "{preview?.title}"-document without first
                  removing this reference.
                </>
              ) : (
                <>
                  This makes it possible to delete the "{preview?.title}"-document without first
                  deleting this reference, leaving this field referencing a nonexisting document.
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
    </RowWrapper>
  )
})
