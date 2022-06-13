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
import {Reference, SchemaType} from '@sanity/types'
import {
  EllipsisVerticalIcon,
  LaunchIcon as OpenInNewTabIcon,
  SyncIcon as ReplaceIcon,
  TrashIcon,
  CopyIcon as DuplicateIcon,
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
import {useObservableCallback} from 'react-rx'
import {uuid} from '@sanity/uuid'
import {useId} from '@reach/auto-id'
import styled from 'styled-components'
import {FormField, FormFieldValidationStatus} from '../../components/formField'
import {PreviewCard} from '../../../components/PreviewCard'
import {FieldPresence} from '../../../presence'
import {IntentLink} from '../../../router'
import {set, setIfMissing, unset} from '../../patch'
import {EMPTY_ARRAY} from '../../utils/empty'
// import {useDidUpdate} from '../../hooks/useDidUpdate'
import {isNonNullable} from '../../utils/isNonNullable'
import {AlertStrip} from '../../components/AlertStrip'
import {RowWrapper} from '../arrays/ArrayOfObjectsInput/item/components/RowWrapper'
import {DragHandle} from '../arrays/common/DragHandle'
import {_InsertEvent} from '../arrays/ArrayOfObjectsInput/types'
import {randomKey} from '../arrays/common/randomKey'
import {InsertMenu} from '../arrays/ArrayOfObjectsInput/InsertMenu'
import {useOnClickOutside} from '../../hooks/useOnClickOutside'
import {FIXME} from '../../types'
import {getPublishedId} from '../../../util'
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

export interface Props extends ReferenceInputProps<OptionalRef> {
  isSortable: boolean
  insertableTypes?: SchemaType[]
  onInsert?: (event: _InsertEvent) => void
}

const NO_FILTER = () => true

const dragHandle = <DragHandle paddingX={1} paddingY={3} />

type PartialPick<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[K]
}

type OptionalRef = PartialPick<Reference, '_ref'>

function valueHasRef<T extends {_ref?: string}>(value: T): value is T & {_ref: string} {
  return typeof value._ref === 'string'
}

export function ArrayItemReferenceInput(props: Props) {
  const {
    schemaType: type,
    value,
    validation,
    liveEdit,
    onSearch,
    onChange,
    insertableTypes,
    focusPath = EMPTY_ARRAY,
    presence,
    createOptions,
    isSortable,
    level,
    onInsert,
    selectedState,
    editReferenceLinkComponent: EditReferenceLink,
    onEditReference,
    getReferenceInfo,
    onBlur,
    onFocus,
    onFocusPath,
    readOnly,
    focusRef,
    renderPreview,
  } = props

  const forwardedRef = useForwardedRef(focusRef)

  const [searchState, setSearchState] = useState<ReferenceSearchState>(INITIAL_SEARCH_STATE)

  const handleCreateNew = (option: CreateReferenceOption) => {
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

    onChange(patches)

    onEditReference({id, type: option.type, template: option.template})
    onFocusPath([])
  }

  const handleDuplicate = useCallback(() => {
    if (value?._key) {
      // todo
      // onInsert?.({
      //   items: [{...value, _key: randomKey()}],
      //   position: 'after',
      // })
    }
  }, [onInsert, value])

  const handleInsert = useCallback(
    (pos: 'before' | 'after') => {
      if (value?._key) {
        // todo
        // onInsert?.({
        //   item: {_type: type.name, _key: randomKey()},
        //   position: pos,
        // })
      }
    },
    [onInsert, type.name, value?._key]
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

      const patches = [
        setIfMissing({}),
        set(type.name, ['_type']),
        set(getPublishedId(id), ['_ref']),
        // if there's no published version of this document, set the reference to weak
        hit.published && !type.weak ? unset(['_weak']) : set(true, ['_weak']),
        hit.published
          ? unset(['_strengthenOnPublish'])
          : set({type: hit?.type, weak: type.weak}, ['_strengthenOnPublish']),
      ].filter(isNonNullable)

      onChange(patches)
      onFocusPath([])
    },
    [searchState.hits, type.name, type.weak, onChange, onFocusPath]
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

  const handleCancelEdit = useCallback(() => {
    if (!value?._ref) {
      onChange(unset())
    }
    onFocusPath([])
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

  const getReferenceInfoMemo = useCallback(
    (id) => getReferenceInfo(id, type),
    [getReferenceInfo, type]
  )

  const loadableReferenceInfo = useReferenceInfo(value?._ref, getReferenceInfoMemo)

  const refTypeName = loadableReferenceInfo.result?.type || value?._strengthenOnPublish?.type

  const refType = refTypeName ? type.to.find((toType) => toType.name === refTypeName) : undefined

  // --- focus handling
  const hasFocusAtRef = focusPath.length === 1 && (focusPath[0] === '_ref' || focusPath[0] === '$')
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
  const weakShouldBe = type.weak === true ? 'weak' : 'strong'

  const hasRef = value && valueHasRef(value)
  // If the reference value is marked with _strengthenOnPublish,
  // we allow weak references if the reference points to a document that has a draft but not a published
  // In all other cases we should display a "weak mismatch" warning
  const weakWarningOverride =
    hasRef && !loadableReferenceInfo.isLoading && value?._strengthenOnPublish

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(type.weak === true ? set(true, ['_weak']) : unset(['_weak']))
  }, [onChange, type])

  const referenceExists = hasRef && loadableReferenceInfo.result?.preview?.published?._id

  const handleRemoveStrengthenOnPublish = useCallback(() => {
    onChange([
      type.weak === true ? set(true, ['_weak']) : unset(['_weak']),
      unset(['_strengthenOnPublish']),
    ])
  }, [onChange, type])

  const {push} = useToast()

  const errors = useMemo(() => validation.filter((item) => item.level === 'error'), [validation])

  const pressed = selectedState === 'pressed'
  const selected = selectedState === 'selected'
  const handleFocus = useCallback(
    (event) => {
      if (event.currentTarget === forwardedRef.current) {
        onFocus(event)
      }
    },
    [onFocus, forwardedRef]
  )

  const handleAutocompleteFocus = useCallback(
    (event) => {
      if (onFocusPath && event.currentTarget === forwardedRef.current) {
        onFocusPath(['_ref'])
      }
    },
    [onFocusPath, forwardedRef]
  )

  const handleQueryChange = useObservableCallback((inputValue$: Observable<string | null>) => {
    return inputValue$.pipe(
      filter(isNonNullable),
      distinctUntilChanged(),
      switchMap((searchString) =>
        concat(
          of({isLoading: true}),
          onSearch(searchString).pipe(
            map((hits) => ({hits, isLoading: false, searchString})),
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
        forwardedRef.current?.focus()
      }
    },
    [forwardedRef]
  )

  const renderOption = useCallback(
    (option) => {
      const id = option.hit.draft?._id || option.hit.published?._id

      return (
        <PreviewCard as="button" type="button" radius={2}>
          <Box paddingX={3} paddingY={1}>
            <OptionPreview
              getReferenceInfo={getReferenceInfoMemo}
              id={id}
              renderPreview={renderPreview}
              type={type}
            />
          </Box>
        </PreviewCard>
      )
    },
    [type, getReferenceInfoMemo, renderPreview]
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
  const clickOutsideBoundaryRef = useRef<HTMLDivElement | null>(null)
  const autocompletePortalRef = useRef<HTMLDivElement | null>(null)
  const createButtonMenuPortalRef = useRef<HTMLDivElement | null>(null)
  useOnClickOutside(
    [clickOutsideBoundaryRef, autocompletePortalRef, createButtonMenuPortalRef],
    () => {
      if (isEditing) {
        handleCancelEdit()
      }
    }
  )

  const autocompletePopoverReferenceElementRef = useRef<HTMLDivElement | null>(null)

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
              validation={validation}
              __unstable_presence={presence}
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
                  ref={forwardedRef}
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
                <StyledPreviewCard
                  flex={1}
                  padding={1}
                  paddingRight={3}
                  radius={2}
                  forwardedAs={EditReferenceLink as FIXME}
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
                  ref={forwardedRef}
                >
                  <PreviewReferenceValue
                    value={value}
                    referenceInfo={loadableReferenceInfo}
                    renderPreview={renderPreview}
                    type={type}
                  />
                </StyledPreviewCard>
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
                  onClick={() => onFocusPath(['_ref'])}
                  ref={forwardedRef}
                >
                  <Box marginY={1}>
                    <Text muted>Empty reference</Text>
                  </Box>
                </Card>
              )}

              <Inline marginLeft={!readOnly && presence.length > 0 ? 2 : undefined}>
                {!readOnly && presence.length > 0 && (
                  <Box marginLeft={1}>
                    <FieldPresence presence={presence} maxAvatars={1} />
                  </Box>
                )}

                {validation.length > 0 && (
                  <Box marginLeft={1} paddingX={1} paddingY={3}>
                    <FormFieldValidationStatus validation={validation} />
                  </Box>
                )}

                {!value?._key && (
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
                          onFocusPath(['_ref'])
                        }}
                      />

                      <MenuItem text="Duplicate" icon={DuplicateIcon} onClick={handleDuplicate} />
                      <InsertMenu onInsert={handleInsert} types={insertableTypes} />
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
      {liveEdit && referenceExists && value._strengthenOnPublish && (
        <AlertStrip
          padding={1}
          title={type.weak ? 'Finalize reference' : 'Convert to strong reference'}
          status="info"
          data-testid="alert-reference-published"
        >
          <Stack space={3}>
            <Text as="p" muted size={1}>
              <strong>{loadableReferenceInfo.result?.preview.published?.title}</strong> is published
              and this reference should now be{' '}
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
    </RowWrapper>
  )
}
