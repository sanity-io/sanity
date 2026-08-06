import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {LayerProvider, useClickOutsideEvent} from '@sanity/ui'
import {type ComponentType, type PropsWithChildren, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs'
import {styled} from 'styled-components'

import {Button as BaseButton} from '../../../ui-components/button/Button'
import {Popover} from '../../../ui-components/popover/Popover'
import {useVersionRelease} from '../../hooks/useVersionRelease'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type TargetPerspective} from '../../perspective/types'
import {usePerspective} from '../../perspective/usePerspective'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {useDocumentVersionsObservable} from '../../releases/hooks/useDocumentVersions'
import {useAllVariants} from '../../variants/store/useAllVariants'
import {getDocumentGroupInventoryActionLabel} from '../utils/getDocumentGroupInventoryActionLabel'

export const DocumentGroupInventoryAction: ComponentType<
  PropsWithChildren<{
    documentId: string
    portalElementName: string
    isDocumentGroupInventoryActive: boolean
    setIsDocumentGroupInventoryActive: (active: boolean) => void
  }>
> = ({
  children,
  documentId,
  portalElementName,
  isDocumentGroupInventoryActive,
  setIsDocumentGroupInventoryActive,
}) => {
  const {t} = useTranslation()
  const displayedRelease = useVersionRelease(documentId)
  const {selectedVariant} = usePerspective()
  const {byId: variantsById} = useAllVariants()
  const buttonElement = useRef<HTMLButtonElement | null>(null)
  const popoverElement = useRef<HTMLDivElement | null>(null)

  const versionState = useDocumentVersionsObservable({documentId})

  const isAvailable = useObservable(
    useMemo(
      () => versionState.pipe(map(({loading, versions}) => !loading && versions.length !== 0)),
      [versionState],
    ),
  )

  const currentVersion = useObservable(
    useMemo(
      () =>
        versionState.pipe(
          map(({versions}) => versions.find((version) => version._id === documentId)),
        ),
      [versionState, documentId],
    ),
  )

  const variantRef = currentVersion?._system?.variant?._ref
  const documentVariant = variantRef ? variantsById.get(variantRef) : undefined
  // Prefer the open document's variant; fall back to the globally selected one
  // (same title shown in the variants navbar).
  const variant = documentVariant ?? selectedVariant

  useClickOutsideEvent(
    (event) => {
      const dialogs = document.querySelectorAll<HTMLElement>('[data-ui="DialogCard"]')

      for (const dialog of Array.from(dialogs)) {
        if (event.target && dialog.contains(event.target as Node)) {
          return
        }
      }

      setIsDocumentGroupInventoryActive(false)
    },
    () => [buttonElement.current, popoverElement.current],
  )

  if (!isAvailable) {
    return null
  }

  return (
    <LayerProvider>
      <Popover
        ref={popoverElement}
        content={children}
        placement="top-end"
        padding={0}
        open={isDocumentGroupInventoryActive}
        portal={portalElementName}
      >
        <Button
          ref={buttonElement}
          data-testid="action-document-group-inventory"
          text={getDocumentGroupInventoryActionLabel({
            perspective: displayedRelease?.release,
            variant,
            t,
          })}
          tone="neutral"
          onClick={() => setIsDocumentGroupInventoryActive(!isDocumentGroupInventoryActive)}
          icon={<VariantIcon perspective={displayedRelease.release} />}
          iconRight={isDocumentGroupInventoryActive ? ChevronDownIcon : ChevronUpIcon}
          tooltipProps={{}}
          mode="ghost"
        />
      </Popover>
    </LayerProvider>
  )
}

const VariantIcon: ComponentType<{perspective: TargetPerspective | undefined}> = ({
  perspective,
}) => {
  if (typeof perspective === 'undefined') {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    return <ReleaseAvatarIcon tone="neutral" />
  }

  return <ReleaseAvatarIcon release={perspective} />
}

const Button = styled(BaseButton)`
  max-inline-size: 40ch;
  overflow: hidden;
  text-overflow: ellipsis;
`
