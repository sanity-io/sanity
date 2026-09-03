import {LayerProvider, useClickOutsideEvent} from '@sanity/ui'
import {type ComponentType, type PropsWithChildren, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs'

import {Button} from '../../../ui-components/button/Button'
import {Popover} from '../../../ui-components/popover/Popover'
import {RhombusIcon} from '../../components/temporary-icons/Rhombus'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useDocumentVersionsObservable} from '../../releases/hooks/useDocumentVersions'
import {button} from './DocumentGroupInventoryAction.css'

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
          className={button}
          data-testid="action-document-group-inventory"
          text={t('document-group-inventory.action.manage-versions')}
          tone="neutral"
          onClick={() => setIsDocumentGroupInventoryActive(!isDocumentGroupInventoryActive)}
          icon={RhombusIcon}
          mode="ghost"
        />
      </Popover>
    </LayerProvider>
  )
}
