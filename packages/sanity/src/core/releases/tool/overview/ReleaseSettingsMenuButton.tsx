import {CogIcon, EditIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useReleasePermissions} from '../../store/useReleasePermissions'
import {getReleaseDefaults} from '../../util/util'
import {ReleaseTemplateDialog} from './ReleaseTemplateDialog'

export function ReleaseSettingsMenuButton(): React.JSX.Element | null {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {createRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const isMountedRef = useRef(false)
  useEffect(() => {
    isMountedRef.current = true
    void checkWithPermissionGuard(createRelease, getReleaseDefaults()).then((allowed) => {
      if (isMountedRef.current) setHasPermission(allowed)
    })
    return () => {
      isMountedRef.current = false
    }
  }, [checkWithPermissionGuard, createRelease])

  const openDialog = useCallback(() => setIsDialogOpen(true), [])
  const closeDialog = useCallback(() => setIsDialogOpen(false), [])

  if (hasPermission === false) return null

  const buttonLabel = t('settings.button.label')

  return (
    <>
      <MenuButton
        id="release-settings-menu"
        button={
          <Button
            icon={CogIcon}
            mode="bleed"
            tooltipProps={{content: buttonLabel}}
            aria-label={buttonLabel}
            data-testid="release-settings-button"
          />
        }
        menu={
          <Menu>
            <MenuItem
              icon={EditIcon}
              onClick={openDialog}
              text={t('settings.menu.release-template')}
              data-testid="release-template-menu-item"
            />
          </Menu>
        }
        popover={{placement: 'bottom-end'}}
      />
      {isDialogOpen && <ReleaseTemplateDialog onClose={closeDialog} />}
    </>
  )
}
