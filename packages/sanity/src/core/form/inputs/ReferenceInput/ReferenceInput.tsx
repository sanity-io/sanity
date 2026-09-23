import {Text, useClickOutsideEvent} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {uuid} from '@sanity/uuid'
import {
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {Flex, VStack} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {ReferenceInputPreviewCard} from '../../../components/previewCard/PreviewCard'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {usePerspective} from '../../../perspective/usePerspective'
import {useSearchMachine} from '../../../search/useSearchMachine'
import {getPublishedId} from '../../../util/draftUtils'
import {isNonNullable} from '../../../util/isNonNullable'
import {Alert} from '../../components/Alert'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {set, setIfMissing, unset} from '../../patch/patch'
import {useArrayItemRootElementRef} from '../arrays/common/useArrayItemRootElementRef'
import {AutocompleteContainer} from './AutocompleteContainer'
import {CreateButton} from './CreateButton'
import {OptionPreview} from './OptionPreview'
import {ReferenceAutocomplete} from './ReferenceAutocomplete'
import {ReferenceInputPreview} from './ReferenceInputPreview'
import {
  type CreateReferenceOption,
  type ReferenceInputProps,
  type ReferenceSearchHit,
} from './types'
import {useReferenceInfo} from './useReferenceInfo'
import {useReferenceInput} from './useReferenceInput'
import {useReferenceItemRef} from './useReferenceItemRef'

const NO_FILTER = () => true

function isNodeInside(
  node: EventTarget | Node | null,
  containers: Array<Node | null | undefined>,
): boolean {
  return Boolean(node instanceof Node && containers.some((container) => container?.contains(node)))
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
    renderPreview,
    path,
    elementProps,
    focusPath,
    validation,
  } = props

  const validationError = validation?.find((v) => v.level === 'error')?.message
  const {selectedReleaseId} = usePerspective()

  const {getReferenceInfo} = useReferenceInput({
    path,
    schemaType,
  })

  const {push} = useToast()
  const {t} = useTranslation()

  const {searchState, handleQueryChange} = useSearchMachine<ReferenceSearchHit>({
    search: onSearch,
    onSearchFailed: (error) => {
      push({
        title: t('inputs.reference.error.search-failed-title'),
        description: error.message,
        status: 'error',
        id: `reference-search-fail-${id}`,
      })

      console.error(error)
    },
  })

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
      onPathFocus(path)
    },
    [
      onChange,
      onEditReference,
      onPathFocus,
      schemaType.name,
      schemaType.weak,
      selectedReleaseId,
      path,
    ],
  )

  const handleChange = useCallback(
    (nextId: string) => {
      if (!nextId) {
        // Autocomplete X clears the search query so the user can type again.
        if (value?._key) {
          // It must not unset the whole object, just the `_ref` so the ref used in an array is not removed.
          onChange(unset(['_ref']))
        } else {
          // If the reference is not used in an array, unset the whole object.
          onChange(unset())
        }
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
      onPathFocus(path)
    },
    [onChange, onPathFocus, schemaType.name, schemaType.weak, searchState.hits, path, value?._key],
  )

  const handleClear = useCallback(() => {
    onChange(unset())
  }, [onChange])

  const handleAutocompleteKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onPathFocus(path)
      }
    },
    [onPathFocus, path],
  )

  const loadableReferenceInfo = useReferenceInfo(value?._ref, getReferenceInfo)

  const [autocompletePopoverReferenceElement, setAutocompletePopoverReferenceElement] =
    useState<HTMLDivElement | null>(null)

  const handleAutocompleteOpenButtonClick = useCallback(() => {
    handleQueryChange('')
  }, [handleQueryChange])

  const handleCreateButtonKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onPathFocus(path)
      }
    },
    [onPathFocus, path],
  )

  const renderOption = useCallback(
    (option: AutocompleteOption) => {
      return (
        <ReferenceInputPreviewCard forwardedAs="button" type="button" radius={2} tone="inherit">
          <OptionPreview
            id={option.hit.id}
            type={option.hit.type}
            renderPreview={renderPreview}
            referenceType={schemaType}
          />
        </ReferenceInputPreviewCard>
      )
    },
    [schemaType, renderPreview],
  )

  const renderValue = useCallback(() => {
    return (loadableReferenceInfo.result?.preview?.snapshot?.title ||
      loadableReferenceInfo.result?.preview?.original?.title ||
      '') as string
  }, [
    loadableReferenceInfo.result?.preview?.original?.title,
    loadableReferenceInfo.result?.preview?.snapshot?.title,
  ])

  // --- click outside / blur handling
  const {menuRef, menuButtonRef, containerRef} = useReferenceItemRef()
  const arrayItemRootElementRef = useArrayItemRootElementRef()
  const clickOutsideBoundaryRef = useRef<HTMLDivElement>(null)
  const autoCompletePortalRef = useRef<HTMLDivElement>(null)
  const createButtonMenuPortalRef = useRef<HTMLDivElement>(null)

  const handleFocus = useCallback(() => onPathFocus(['_ref']), [onPathFocus])

  // Everything that counts as "inside" the reference input for focus purposes.
  // Mirrors the boundaries passed to useClickOutsideEvent below.
  const getChromeElements = useCallback(
    () => [
      autocompletePopoverReferenceElement,
      containerRef.current,
      menuButtonRef.current,
      menuRef.current,
      autoCompletePortalRef.current,
      createButtonMenuPortalRef.current,
      clickOutsideBoundaryRef.current,
      arrayItemRootElementRef?.current,
    ],
    [
      arrayItemRootElementRef,
      autocompletePopoverReferenceElement,
      containerRef,
      menuButtonRef,
      menuRef,
    ],
  )

  // Safari blurs the input on mousedown of a portaled option without moving
  // focus (relatedTarget is null, activeElement is body). Remember whether
  // that pointerdown was still inside the reference chrome so the deferred
  // Autocomplete onBlur does not tear down the picker.
  const pointerDownInsideChromeRef = useRef(false)
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      pointerDownInsideChromeRef.current = isNodeInside(event.target, getChromeElements())
    }
    // Reset on cancel too: a press that ends off-window or turns into a scroll
    // never delivers pointerup, and a stuck flag would swallow the next real blur.
    const onPointerEnd = () => {
      pointerDownInsideChromeRef.current = false
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('pointerup', onPointerEnd, true)
    document.addEventListener('pointercancel', onPointerEnd, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('pointerup', onPointerEnd, true)
      document.removeEventListener('pointercancel', onPointerEnd, true)
    }
  }, [getChromeElements])

  const handleBlur = useCallback(
    (event: FocusEvent) => {
      if (pointerDownInsideChromeRef.current) {
        return
      }
      // Autocomplete calls onBlur after a timeout and checks document.activeElement,
      // so relatedTarget can be stale or null by the time we run.
      const chrome = getChromeElements()
      if (
        !isNodeInside(event.relatedTarget, chrome) &&
        !isNodeInside(document.activeElement, chrome)
      ) {
        props.elementProps.onBlur(event)
      }
    },
    [getChromeElements, props.elementProps],
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

  useClickOutsideEvent(
    // Empty references still clear on outside click. Valued references only
    // exit replace mode while editing — a populated preview must not steal
    // focus from another field.
    (!value?._ref || isEditing) &&
      (() => {
        if (!value?._ref) {
          // Handle clicks outside while the input is focused
          if (isEditing || document.activeElement === menuButtonRef.current) {
            handleClear()
          }
        } else {
          onPathFocus([])
        }
      }),
    () => [
      menuRef.current,
      menuButtonRef.current,
      containerRef.current,
      clickOutsideBoundaryRef.current,
      autoCompletePortalRef.current,
      createButtonMenuPortalRef.current,
      // The enclosing array item (when inside one). Custom item/input
      // components may render their own UI (e.g. a "Create new" button) around
      // the default input, and clicking it must not clear the empty item —
      // clearing on mousedown unmounts such elements before their click
      // handlers get a chance to run.
      arrayItemRootElementRef?.current ?? null,
    ],
  )

  return (
    <div style={props.elementProps.style}>
      <ReferenceInputPreview {...props}>
        <VStack gap={1} data-testid="reference-input" ref={clickOutsideBoundaryRef}>
          <VStack gap={2}>
            {isWeakRefToNonexistent ? (
              <Alert
                data-testid="alert-nonexistent-document"
                title={t('inputs.reference.error.nonexistent-document-title')}
                suffix={
                  <Flex padding={2} flexDirection="column">
                    <Button
                      text={t('inputs.reference.error.nonexistent-document.clear-button-label')}
                      onClick={handleClear}
                    />
                  </Flex>
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
                path={path}
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
                customValidity={validationError}
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
          </VStack>
        </VStack>
      </ReferenceInputPreview>
    </div>
  )
}
