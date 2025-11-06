import {AddUserIcon, CogIcon} from '@sanity/icons'
import {MenuDivider} from '@sanity/ui'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {userHasRole} from '../../../../util'
import {useEnvAwareSanityWebsiteUrl} from '../../../hooks/useEnvAwareSanityWebsiteUrl'
import {useWorkspace} from '../../../workspace'

export function ManageMenu() {
  const {currentUser, projectId} = useWorkspace()
  const isAdmin = Boolean(currentUser && userHasRole(currentUser, 'administrator'))

  const {t} = useTranslation()
  const envAwareWebsiteUrl = useEnvAwareSanityWebsiteUrl()
  return (
    <>
      <MenuDivider />
      <MenuItem
        as="a"
        aria-label={t('user-menu.action.manage-project-aria-label')}
        href={`${envAwareWebsiteUrl}/manage/project/${projectId}`}
        target="_blank"
        text={t('user-menu.action.manage-project')}
        icon={CogIcon}
      />
      {isAdmin && (
        <MenuItem
          as="a"
          aria-label={t('user-menu.action.invite-members-aria-label')}
          href={`${envAwareWebsiteUrl}/manage/project/${projectId}/members?invite=true`}
          target="_blank"
          text={t('user-menu.action.invite-members')}
          icon={AddUserIcon}
        />
      )}
    </>
  )
}
