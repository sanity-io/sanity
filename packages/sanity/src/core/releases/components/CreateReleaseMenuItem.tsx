import {AddIcon} from '@sanity/icons'
import {type ComponentProps, type ComponentType, useEffect, useRef, useState} from 'react'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useReleasesUpsell} from '../contexts/upsell/useReleasesUpsell'
import {useCreateReleaseMetadata} from '../hooks/useCreateReleaseMetadata'
import {useReleaseOperations} from '../store/useReleaseOperations'
import {useReleasePermissions} from '../store/useReleasePermissions'
import {getReleaseDefaults} from '../util/util'

interface Props {
  onCreateRelease: () => void
}

export const CreateReleaseMenuItem: ComponentType<Props> = ({onCreateRelease}) => {
  const {t} = useTranslation()
  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)
  const {mode: planQuotaMode} = useReleasesUpsell()
  const {createRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const createReleaseMetadata = useCreateReleaseMetadata()

  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true

    checkWithPermissionGuard(createRelease, createReleaseMetadata(getReleaseDefaults())).then(
      (hasPermission) => {
        if (isMounted.current) setHasCreatePermission(hasPermission)
      },
    )

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, createRelease, createReleaseMetadata])

  const menuItemProps: Pick<ComponentProps<typeof MenuItem>, 'icon' | 'onClick' | 'text'> & {
    'data-testid': string
  } = {
    'icon': AddIcon,
    'onClick': onCreateRelease,
    'data-testid': 'create-new-release-button',
    'text': t('release.action.create-new'),
  }

  if (!hasCreatePermission || planQuotaMode === 'disabled') {
    return (
      <MenuItem
        {...menuItemProps}
        tooltipProps={{
          disabled: hasCreatePermission === true,
          content: t('release.action.permission.error'),
        }}
        disabled
      />
    )
  }

  return <MenuItem {...menuItemProps} />
}
