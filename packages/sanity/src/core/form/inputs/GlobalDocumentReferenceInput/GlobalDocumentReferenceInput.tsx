import {ResetIcon as ClearIcon, SyncIcon as ReplaceIcon} from '@sanity/icons'
import {
  type GlobalDocumentReferenceSchemaType,
  type GlobalDocumentReferenceValue,
  isGlobalDocumentReference,
} from '@sanity/types'
import {Box, Card, Flex, Inline, Menu, Stack, useClickOutsideEvent, useToast} from '@sanity/ui'
import {
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {useObservableEvent} from 'react-rx'
import {concat, type Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, filter, map, scan, switchMap, tap} from 'rxjs/operators'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {ChangeIndicator} from '../../../changeIndicators'
import {PreviewCard} from '../../../components'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {type FIXME} from '../../../FIXME'
import {useTranslation} from '../../../i18n'
import {getPublishedId, isNonNullable} from '../../../util'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {set, unset} from '../../patch'
import {type ObjectInputProps} from '../../types'
import {ReferenceMetadataLoadErrorAlertStrip} from '../ReferenceInput/ReferenceMetadataLoadFailure'
import {ReferenceStrengthMismatchAlertStrip} from '../ReferenceInput/ReferenceStrengthMismatchAlertStrip'
import {OptionPreview} from './OptionPreview'
import {PreviewReferenceValue} from './PreviewReferenceValue'
import {ReferenceAutocomplete} from './ReferenceAutocomplete'
import {type GlobalDocumentReferenceInfo, type SearchHit, type SearchState} from './types'
import {type GetReferenceInfoFn, useReferenceInfo} from './useReferenceInfo'

const INITIAL_SEARCH_STATE: SearchState = {
  hits: [],
  isLoading: false,
}

/** @internal */
export interface GlobalDocumentReferenceInputProps
  extends ObjectInputProps<GlobalDocumentReferenceValue, GlobalDocumentReferenceSchemaType> {
  getReferenceInfo: (
    doc: {_id: string; _type?: string},
    type: GlobalDocumentReferenceSchemaType,
  ) => Observable<GlobalDocumentReferenceInfo>
  onSearch: (query: string) => Observable<SearchHit[]>
}

const NO_FILTER = () => true

const REF_PATH = ['_ref']

/** @internal */
export function GlobalDocumentReferenceInput(props: GlobalDocumentReferenceInputProps): ReactNode {
  const {
    changed,
    focused,
    focusPath,
    getReferenceInfo,
    onChange,
    onPathFocus,
    onSearch,
    path,
    readOnly,
    schemaType,
    validation,
    value,
    elementProps,
  } = props

  const {t} = useTranslation()

  const [searchState, setSearchState] = useState<SearchState>(INITIAL_SEARCH_STATE)

  const handleChange = useCallback(
    (id: string) => {
      if (!id) {
        onChange(unset())
        onPathFocus([])
        return
      }

      const hit = searchState.hits.find((h) => h.id === id)

      if (!hit) {
        throw new Error('Selected an item that wasnt part of the result set')
      }

      onChange(
        set({
          _type: schemaType.name,
          _ref: `${schemaType.resourceType}:${schemaType.resourceId}:${getPublishedId(id)}`,
          _weak: schemaType.weak,
          // persist _key between mutations if the value is in an array
          _key: value?._key,
        }),
      )

      onPathFocus([])
    },
    [
      value?._key,
      searchState.hits,
      schemaType.name,
      schemaType.resourceType,
      schemaType.resourceId,
      schemaType.weak,
      onChange,
      onPathFocus,
    ],
  )

  const handleClear = useCallback(() => {
    onChange(unset())
  }, [onChange])

  const handleAutocompleteKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        onPathFocus?.([])
      }
    },
    [onPathFocus],
  )

  const getReferenceInfoMemo: GetReferenceInfoFn = useCallback(
    (doc) => getReferenceInfo(doc, schemaType),
    [getReferenceInfo, schemaType],
  )

  const refDoc = useMemo(() => {
    if (!value?._ref) {
      return null
    }

    const [, , _id] = value._ref.split(':', 3)
    return {_id}
  }, [value])

  const loadableReferenceInfo = useReferenceInfo(refDoc as FIXME, getReferenceInfoMemo)

  const [autocompletePopoverReferenceElement, setAutocompletePopoverReferenceElement] =
    useState<HTMLDivElement | null>(null)

  const hasFocusAtRef = focusPath.length === 1 && focusPath[0] === '_ref'

  // --- focus handling
  const focusElementRef = elementProps.ref
  useDidUpdate({hasFocusAt: hasFocusAtRef, ref: value?._ref}, (prev, current) => {
    const refUpdated = prev?.ref !== current.ref
    const focusAtUpdated = prev?.hasFocusAt !== current.hasFocusAt

    if ((focusAtUpdated || refUpdated) && current.hasFocusAt) {
      // if search mode changed and we're having focus always ensure the
      // ref element gets focus
      focusElementRef.current?.focus()
    }
  })

  const actualStrength = value?._weak ? 'weak' : 'strong'
  const weakShouldBe = schemaType.weak === true ? 'weak' : 'strong'

  const hasRef = Boolean(value?._ref)

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(schemaType.weak === true ? set(true, ['_weak']) : unset(['_weak']))
  }, [onChange, schemaType])

  const {push} = useToast()

  const errors = useMemo(() => validation.filter((item) => item.level === 'error'), [validation])

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget === elementProps.ref.current) {
        onPathFocus?.([])
      }
    },
    [elementProps.ref, onPathFocus],
  )

  const handleBlur = useCallback((event: FocusEvent) => elementProps.onBlur(event), [elementProps])

  const handleAutocompleteFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (event.currentTarget === elementProps.ref.current) {
        onPathFocus?.(REF_PATH)
      }
    },
    [elementProps.ref, onPathFocus],
  )
  const handleReplace = useCallback(() => {
    onPathFocus?.(REF_PATH)
  }, [onPathFocus])

  const inputId = useId()

  const handleQueryChange = useObservableEvent((inputValue$: Observable<string | null>) => {
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
            }),
          ),
        ),
      ),

      scan(
        (prevState, nextState): SearchState => ({...prevState, ...nextState}),
        INITIAL_SEARCH_STATE,
      ),

      tap(setSearchState),
    )
  })

  const handleAutocompleteOpenButtonClick = useCallback(() => {
    handleQueryChange('')
  }, [handleQueryChange])

  const showWeakRefMismatch =
    !loadableReferenceInfo.isLoading && hasRef && actualStrength !== weakShouldBe

  const studioUrl: string | null = useMemo(() => {
    if (!value?._ref) {
      return null
    }

    if (!isGlobalDocumentReference(value)) {
      return null
    }
    const [, , documentId] = value._ref.split(':')

    if (!schemaType.studioUrl || !loadableReferenceInfo?.result?.type) {
      return null
    }

    if (typeof schemaType.studioUrl === 'string') {
      return `${schemaType.studioUrl}/desk/intent/edit/id=${documentId};type=${loadableReferenceInfo.result.type}/`
    }

    return schemaType.studioUrl({
      id: documentId,
      type: loadableReferenceInfo.result.type,
    })
  }, [value, schemaType, loadableReferenceInfo])

  const renderOption = useCallback(
    (option: FIXME) => {
      return (
        <PreviewCard as="button" type="button" radius={2}>
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
    [schemaType, getReferenceInfoMemo],
  )

  const isEditing = hasFocusAtRef || !value?._ref

  // --- click outside handling
  const clickOutsideBoundaryRef = useRef<HTMLDivElement | null>(null)
  const autocompletePortalRef = useRef<HTMLDivElement | null>(null)
  useClickOutsideEvent(hasFocusAtRef && (() => onPathFocus([])), () => [
    clickOutsideBoundaryRef.current,
    autocompletePortalRef.current,
  ])

  return (
    <Stack space={1}>
      {isEditing ? (
        <Stack space={2} ref={clickOutsideBoundaryRef}>
          <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
            <div ref={setAutocompletePopoverReferenceElement}>
              <ReferenceAutocomplete
                {...elementProps}
                data-testid="autocomplete"
                loading={searchState.isLoading}
                referenceElement={autocompletePopoverReferenceElement}
                portalRef={autocompletePortalRef}
                id={inputId || ''}
                options={searchState.hits.map((hit) => ({
                  value: hit.id,
                  hit: hit,
                }))}
                onFocus={handleAutocompleteFocus}
                radius={2}
                placeholder={t('inputs.reference.search-placeholder')}
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
            flex={1}
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
                  as="a"
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
                  onBlur={handleBlur}
                  ref={elementProps.ref}
                >
                  <PreviewReferenceValue
                    value={value}
                    referenceInfo={loadableReferenceInfo}
                    showStudioUrlIcon
                    hasStudioUrl
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
                  onBlur={handleBlur}
                  ref={elementProps.ref}
                >
                  <PreviewReferenceValue
                    value={value}
                    referenceInfo={loadableReferenceInfo}
                    type={schemaType}
                  />
                </PreviewCard>
              )}

              <Inline paddingX={1}>
                <MenuButton
                  button={<ContextMenuButton data-testid="menu-button" />}
                  id={`${inputId}-menuButton`}
                  menu={
                    <Menu>
                      {!readOnly && (
                        <>
                          <MenuItem
                            text={t('inputs.reference.action.clear')}
                            tone="critical"
                            icon={ClearIcon}
                            data-testid="menu-item-clear"
                            onClick={handleClear}
                          />

                          <MenuItem
                            text={t('inputs.reference.action.replace')}
                            icon={ReplaceIcon}
                            data-testid="menu-item-replace"
                            onClick={handleReplace}
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
              <ReferenceStrengthMismatchAlertStrip
                actualStrength={actualStrength}
                handleFixStrengthMismatch={handleFixStrengthMismatch}
              />
            )}

            {loadableReferenceInfo.error && (
              <ReferenceMetadataLoadErrorAlertStrip
                errorMessage={loadableReferenceInfo.error.message}
                onHandleRetry={loadableReferenceInfo.retry!}
              />
            )}
          </Card>
        </ChangeIndicator>
      )}
    </Stack>
  )
}
