import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {LayerProvider, useClickOutsideEvent} from '@sanity/ui'
import {type ComponentType, type PropsWithChildren, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs'
import {styled} from 'styled-components'

import {Button as BaseButton} from '../../../ui-components/button/Button'
import {Popover} from '../../../ui-components/popover/Popover'
import {type VersionReleaseDocument, useVersionRelease} from '../../hooks/useVersionRelease'
import {type TFunction, useTranslation} from '../../i18n'
import {type TargetPerspective} from '../../perspective/types'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {useDocumentVersionsObservable} from '../../releases/hooks/useDocumentVersions'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'
import {isAgentBundleName} from '../../store'

export const DocumentGroupInventoryAction: ComponentType<
  PropsWithChildren<{
    document: VersionReleaseDocument
    portalElementName: string
    isDocumentGroupInventoryActive: boolean
    setIsDocumentGroupInventoryActive: (active: boolean) => void
  }>
> = ({
  children,
  document,
  portalElementName,
  isDocumentGroupInventoryActive,
  setIsDocumentGroupInventoryActive,
}) => {
  const {t} = useTranslation()
  const displayedRelease = useVersionRelease(document)
  const buttonElement = useRef<HTMLButtonElement | null>(null)
  const popoverElement = useRef<HTMLDivElement | null>(null)

  const versionState = useDocumentVersionsObservable({documentId: document._id})

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
          text={variantLabel({perspective: displayedRelease?.release, t})}
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

function variantLabel({
  perspective,
  t,
}: {
  perspective: TargetPerspective | undefined
  t: TFunction
}): string {
  if (typeof perspective === 'undefined') {
    return ''
  }

  if (isAgentBundleName(perspective)) {
    return t('version.agent-bundle.proposed-changes')
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
