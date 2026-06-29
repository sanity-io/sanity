import {ChevronDownIcon, ChevronUpIcon} from '@sanity/icons'
import {LayerProvider, useClickOutsideEvent} from '@sanity/ui'
import {type ComponentType, type PropsWithChildren, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs'
import {styled} from 'styled-components'

import {Button as BaseButton} from '../../../ui-components/button/Button'
import {Popover} from '../../../ui-components/popover/Popover'
import {useVersionRelease} from '../../hooks/useVersionRelease'
import {type TargetPerspective} from '../../perspective/types'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {useDocumentVersionsObservable} from '../../releases/hooks/useDocumentVersions'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'

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
  const displayedRelease = useVersionRelease(documentId)
  const buttonElement = useRef<HTMLButtonElement | null>(null)
  const popoverElement = useRef<HTMLDivElement | null>(null)

  const versionState = useDocumentVersionsObservable({documentId})

  const isAvailable = useObservable(
    useMemo(
      () => versionState.pipe(map(({loading, versions}) => !loading && versions.length !== 0)),
      [versionState],
    ),
  )

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
          text={variantLabel(displayedRelease?.release)}
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

function variantLabel(perspective: TargetPerspective | undefined): string {
  if (typeof perspective === 'undefined') {
    return ''
  }

  if (isDraftPerspective(perspective)) {
    return 'Draft'
  }

  if (isPublishedPerspective(perspective)) {
    return 'Published'
  }

  if (typeof perspective === 'string') {
    return perspective
  }

  return perspective.metadata.title ?? perspective._id
}

const VariantIcon: ComponentType<{perspective: TargetPerspective | undefined}> = ({
  perspective,
}) => {
  if (typeof perspective === 'undefined') {
    return <ReleaseAvatarIcon tone="neutral" />
  }

  return <ReleaseAvatarIcon release={perspective} />
}

const Button = styled(BaseButton)`
  max-inline-size: 40ch;
  overflow: hidden;
  text-overflow: ellipsis;
`
