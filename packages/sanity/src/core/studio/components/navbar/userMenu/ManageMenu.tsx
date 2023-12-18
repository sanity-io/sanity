import {CogIcon, UsersIcon} from '@sanity/icons'
import {MenuDivider} from '@sanity/ui'
import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {userHasRole} from '../../../../util'
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
          href={`https://sanity.io/manage/project/${projectId}/members`}
          target="_blank"
          text={t('user-menu.action.invite-members')}
          icon={UsersIcon}
        />
      )}
    </>
  )
}
