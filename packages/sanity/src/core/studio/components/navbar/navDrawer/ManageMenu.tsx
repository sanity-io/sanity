import {CogIcon, UsersIcon} from '@sanity/icons'
import {Card, Stack} from '@sanity/ui'
import {Button} from '../../../../../ui'
import {useTranslation} from '../../../../i18n'
import {userHasRole} from '../../../../util'
import {useWorkspace} from '../../../workspace'
import {FreeTrial} from '../free-trial'

export function ManageMenu() {
  const {currentUser, projectId} = useWorkspace()
  const isAdmin = Boolean(currentUser && userHasRole(currentUser, 'administrator'))

  const {t} = useTranslation()

  return (
    <Card borderTop flex="none" padding={2}>
      <Stack as="ul" space={1}>
        <Stack as="li">
          <FreeTrial type="sidebar" />
          <Button
            aria-label={t('user-menu.action.manage-project-aria-label')}
            as="a"
            href={`https://sanity.io/manage/project/${projectId}`}
            icon={CogIcon}
            justify="flex-start"
            mode="bleed"
            size="large"
            target="_blank"
            text={t('user-menu.action.manage-project')}
          />
        </Stack>

        {isAdmin && (
          <Stack as="li">
            <Button
              aria-label={t('user-menu.action.invite-members-aria-label')}
              as="a"
              href={`https://sanity.io/manage/project/${projectId}/members`}
              icon={UsersIcon}
              justify="flex-start"
              mode="bleed"
              size="large"
              target="_blank"
              text={t('user-menu.action.invite-members')}
            />
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
