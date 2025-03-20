import {AddUserIcon, CogIcon} from '@sanity/icons'
import {MenuDivider} from '@sanity/ui'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {userHasRole} from '../../../../util/userHasRole'
import {useWorkspace} from '../../../workspace'

export function ManageMenu() {
  const {currentUser, projectId} = useWorkspace()
  const isAdmin = Boolean(currentUser && userHasRole(currentUser, 'administrator'))

  const {t} = useTranslation()

  return (
    <>
      <MenuDivider />
      <MenuItem
        as="a"
        aria-label={t('user-menu.action.manage-project-aria-label')}
        href={`https://sanity.io/manage/project/${projectId}`}
        target="_blank"
        text={t('user-menu.action.manage-project')}
        icon={CogIcon}
      />
      {isAdmin && (
        <MenuItem
          as="a"
          aria-label={t('user-menu.action.invite-members-aria-label')}
          href={`https://www.sanity.io/manage/project/${projectId}/members?invite=true`}
          target="_blank"
          text={t('user-menu.action.invite-members')}
          icon={AddUserIcon}
        />
      )}
    </>
  )
}
