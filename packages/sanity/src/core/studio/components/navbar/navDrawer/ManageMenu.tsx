import {AddUserIcon, CogIcon} from '@sanity/icons'
import {Card, Stack} from '@sanity/ui'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {userHasRole} from '../../../../util/userHasRole'
import {useWorkspace} from '../../../workspace'
import {FreeTrial} from '../free-trial/FreeTrial'

export function ManageMenu() {
  const {currentUser, projectId} = useWorkspace()
  const isAdmin = Boolean(currentUser && userHasRole(currentUser, 'administrator'))

  const {t} = useTranslation()

  return (
    <Card borderTop flex="none" padding={2}>
      <Stack as="ul" space={1}>
        <Stack as="li">
          <FreeTrial type="sidebar" />
        </Stack>

        <Stack as="li">
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
              href={`https://www.sanity.io/manage/project/${projectId}/members?invite=true`}
              icon={AddUserIcon}
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
