import {Stack, Text, useClickOutsideEvent, useToast} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {type FocusEvent, type KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import {useObservableEvent} from 'react-rx'
import {concat, type Observable, of} from 'rxjs'
import {catchError, filter, map, scan, switchMap, tap} from 'rxjs/operators'

import {Button} from '../../../../ui-components'
import {ReferenceInputPreviewCard} from '../../../components'
import {Translate, useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {getPublishedId, isNonNullable} from '../../../util'
import {Alert} from '../../components/Alert'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {set, setIfMissing, unset} from '../../patch'
import {AutocompleteContainer} from './AutocompleteContainer'
import {CreateButton} from './CreateButton'
import {OptionPreview} from './OptionPreview'
import {ReferenceAutocomplete} from './ReferenceAutocomplete'
import {
  type CreateReferenceOption,
  type ReferenceInputProps,
  type ReferenceSearchHit,
  type ReferenceSearchState,
} from './types'
import {useReferenceInfo} from './useReferenceInfo'
import {useReferenceInput} from './useReferenceInput'
import {useReferenceItemRef} from './useReferenceItemRef'

const INITIAL_SEARCH_STATE: ReferenceSearchState = {
  hits: [],
  isLoading: false,
}

const NO_FILTER = () => true

function nonNullable<T>(v: T): v is NonNullable<T> {
  return v !== null
}

interface AutocompleteOption {
  hit: ReferenceSearchHit
  value: string
}
export function ReferenceInput(props: ReferenceInputProps) {
  const {
    createOptions,
    onChange,
    onEditReference,
    onSearch,
    schemaType,
    readOnly,
    id,
    onPathFocus,
    value,
    version,
    renderPreview,
    path,
    elementProps,
    focusPath,
  } = props
  const {selectedReleaseId} = usePerspective()

  const {getReferenceInfo} = useReferenceInput({
    path,
    schemaType,
    value,
    version,
  })

  const [searchState, setSearchState] = useState<ReferenceSearchState>(INITIAL_SEARCH_STATE)

  const handleCreateNew = useCallback(
    (option: CreateReferenceOption) => {
      const newDocumentId = uuid()

      // The strengthen-on-publish process is not necessary for documents inside a release, and in
      // fact must be skipped in order for release preflight checks to function.
      //
      // Strengthen-on-publish is still necessary for drafts, and for documents in a bundle
      // *that isn't a release* (this isn't a scenario Studio supports today, but it may need to in
      // the future).
      const shouldStrengthenOnPublish = typeof selectedReleaseId === 'undefined'
      const strengthenOnPublishPatches = shouldStrengthenOnPublish ? [set(true, ['_weak'])] : []

      // The `_strengthenOnPublish` field is always set, regardless of whether the
      // strengthen-on-publish process should be used. This is because the field is used to
      // store details such as the non-existing document's type, which Studio uses to render
      // reference previews.
      //
      // Content Lake will only strengthen the reference if **both** `_strengthenOnPublish` and
      // `_weak` are truthy.
      //
      // Yes, this is confusing.
      const createInPlaceMetadataPatches = [
        set({type: option.type, weak: schemaType.weak, template: option.template}, [
          '_strengthenOnPublish',
        ]),
      ]

      const patches = [
        setIfMissing({}),
        set(schemaType.name, ['_type']),
        set(newDocumentId, ['_ref']),
      ]
        .concat(strengthenOnPublishPatches, createInPlaceMetadataPatches)
        .filter(isNonNullable)

      onChange(patches)

      onEditReference({
        id: newDocumentId,
        type: option.type,
        template: option.template,
        version: selectedReleaseId,
      })
      onPathFocus([])
    },
    [onChange, onEditReference, onPathFocus, schemaType.name, schemaType.weak, selectedReleaseId],
  )

  const handleChange = useCallback(
    (nextId: string) => {
      if (!nextId) {
        onChange(unset())
        onPathFocus([])
        return
      }

      const hit = searchState.hits.find((h) => h.id === nextId)

      if (!hit) {
        throw new Error('Selected an item that wasnt part of the result set')
      }
      // if there's no published version of this document, set the reference to weak

      const patches = [
        setIfMissing({}),
        set(schemaType.name, ['_type']),
        set(getPublishedId(nextId), ['_ref']),
        hit.published && !schemaType.weak ? unset(['_weak']) : set(true, ['_weak']),
        hit.published
          ? unset(['_strengthenOnPublish'])
          : set({type: hit?.type, weak: schemaType.weak}, ['_strengthenOnPublish']),
      ].filter(isNonNullable)

      onChange(patches)
      // Move focus away from _ref and one level up
      onPathFocus([])
    },
    [onChange, onPathFocus, schemaType.name, schemaType.weak, searchState.hits],
  )

  const handleClear = useCallback(() => {
    onChange(unset())
  }, [onChange])

  const handleAutocompleteKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onPathFocus([])
      }
    },
    [onPathFocus],
  )

  const loadableReferenceInfo = useReferenceInfo(value?._ref, getReferenceInfo)

  const [autocompletePopoverReferenceElement, setAutocompletePopoverReferenceElement] =
    useState<HTMLDivElement | null>(null)

  const {push} = useToast()
  const {t} = useTranslation()

  const handleQueryChange = useObservableEvent((inputValue$: Observable<string | null>) => {
    return inputValue$.pipe(
      filter(nonNullable),
      switchMap((searchString) =>
        concat(
          of({isLoading: true}),
          onSearch(searchString).pipe(
            map((hits) => ({hits, searchString, isLoading: false})),
            catchError((error) => {
              push({
                title: t('inputs.reference.error.search-failed-title'),
                description: error.message,
                status: 'error',
                id: `reference-search-fail-${id}`,
              })

              console.error(error)
              return of({hits: []})
            }),
          ),
        ),
      ),

      scan(
        (prevState, nextState): ReferenceSearchState => ({...prevState, ...nextState}),
        INITIAL_SEARCH_STATE,
      ),

      tap(setSearchState),
    )
  })

  const handleAutocompleteOpenButtonClick = useCallback(() => {
    handleQueryChange('')
  }, [handleQueryChange])

  const handleCreateButtonKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onPathFocus([])
      }
    },
    [onPathFocus],
  )

  const renderOption = useCallback(
    (option: AutocompleteOption) => {
      const documentId = option.hit.draft?._id || option.hit.published?._id || option.value

      return (
        <ReferenceInputPreviewCard forwardedAs="button" type="button" radius={2} tone="inherit">
          <OptionPreview
            getReferenceInfo={getReferenceInfo}
            id={documentId}
            renderPreview={renderPreview}
            type={schemaType}
          />
        </ReferenceInputPreviewCard>
      )
    },
    [schemaType, getReferenceInfo, renderPreview],
  )

  const renderValue = useCallback(() => {
    return (loadableReferenceInfo.result?.preview?.snapshot?.title ||
      loadableReferenceInfo.result?.preview?.original?.title ||
      '') as string
  }, [
    loadableReferenceInfo.result?.preview?.original?.title,
    loadableReferenceInfo.result?.preview?.snapshot?.title,
  ])

  const handleFocus = useCallback(() => onPathFocus(['_ref']), [onPathFocus])
  const handleBlur = useCallback(
    (event: FocusEvent) => {
      if (!autocompletePopoverReferenceElement?.contains(event.relatedTarget)) {
        props.elementProps.onBlur(event)
      }
    },
    [autocompletePopoverReferenceElement, props.elementProps],
  )

  const isWeakRefToNonexistent =
    loadableReferenceInfo?.result?.availability?.reason === 'NOT_FOUND' &&
    !value?._strengthenOnPublish &&
    value?._weak

  useDidUpdate(focusPath?.[0] === '_ref', (hadFocusAtRef, hasFocusAtRef) => {
    if (!hadFocusAtRef && hasFocusAtRef) {
      elementProps.ref.current?.focus()
    }
  })
  const hits: AutocompleteOption[] = useMemo(
    () =>
      searchState.hits.map((hit) => ({
        value: hit.id,
        hit: hit,
      })),
    [searchState.hits],
  )

  const isEditing = focusPath.length === 1 && focusPath[0] === '_ref'

  // --- click outside handling
  const {menuRef, menuButtonRef, containerRef} = useReferenceItemRef()
  const clickOutsideBoundaryRef = useRef<HTMLDivElement>(null)
  const autoCompletePortalRef = useRef<HTMLDivElement>(null)
  const createButtonMenuPortalRef = useRef<HTMLDivElement>(null)
  useClickOutsideEvent(
    // We only clear on clicks outside if the ref does not have a value yet
    !value?._ref &&
      (() => {
        // Handle clicks outside while the input is focused
        if (isEditing) {
          handleClear()
        }
        // And handle ReferenceItem clicks outside after clicking the context menu:
        // 1. Click "+ Add item".
        // 2. The empty reference has focus.
        // 3. Click on the "••• Show more" button.
        // 4. Focus leaves the empty reference autocomplete and moves to the menu.
        // 5. Clicking outside of the menu should be handled as if `isEditing` were `true`
        else if (document.activeElement === menuButtonRef.current) {
          // If the menu button has focus when this event fires then it means the user clicked outside the menu and we should close
          handleClear()
        }
      }),
    () => [
      menuRef.current,
      menuButtonRef.current,
      containerRef.current,
      clickOutsideBoundaryRef.current,
      autoCompletePortalRef.current,
      createButtonMenuPortalRef.current,
    ],
  )

  return (
    <Stack space={1} data-testid="reference-input" ref={clickOutsideBoundaryRef}>
      <Stack space={2}>
        {isWeakRefToNonexistent ? (
          <Alert
            data-testid="alert-nonexistent-document"
            title={t('inputs.reference.error.nonexistent-document-title')}
            suffix={
              <Stack padding={2}>
                <Button
                  text={t('inputs.reference.error.nonexistent-document.clear-button-label')}
                  onClick={handleClear}
                />
              </Stack>
            }
          >
            <Text size={1}>
              <Translate
                i18nKey="inputs.reference.error.nonexistent-document-description"
                t={t}
                values={{documentId: value._ref}}
              />
            </Text>
          </Alert>
        ) : null}
        <AutocompleteContainer ref={setAutocompletePopoverReferenceElement}>
          <ReferenceAutocomplete
            {...elementProps}
            onFocus={handleFocus}
            onBlur={handleBlur}
            data-testid="autocomplete"
            loading={searchState.isLoading}
            referenceElement={autocompletePopoverReferenceElement}
            options={hits}
            radius={2}
            placeholder={t('inputs.reference.search-placeholder')}
            onKeyDown={handleAutocompleteKeyDown}
            readOnly={loadableReferenceInfo.isLoading || readOnly}
            onQueryChange={handleQueryChange}
            searchString={searchState.searchString}
            onChange={handleChange}
            filterOption={NO_FILTER}
            renderOption={renderOption as any}
            renderValue={renderValue}
            openButton={{onClick: handleAutocompleteOpenButtonClick}}
            portalRef={autoCompletePortalRef}
            value={value?._ref}
          />

          {createOptions.length > 0 && (
            <CreateButton
              id={`${id}-selectTypeMenuButton`}
              readOnly={readOnly}
              createOptions={createOptions}
              onCreate={handleCreateNew}
              onKeyDown={handleCreateButtonKeyDown}
              menuRef={createButtonMenuPortalRef}
            />
          )}
        </AutocompleteContainer>
      </Stack>
    </Stack>
  )
}
