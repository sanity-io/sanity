import {AddUserIcon, CogIcon} from '@sanity/icons'
import {Card, Stack} from '@sanity/ui'

import {Button} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useEnvAwareSanityWebsiteUrl} from '../../../hooks/useEnvAwareSanityWebsiteUrl'
import {useWorkspace} from '../../../workspace'
import {FreeTrial} from '../free-trial'
import {useCanInviteProjectMembers} from '../useCanInviteMembers'

export function ManageMenu() {
  const {projectId} = useWorkspace()

  const {t} = useTranslation()
  const envAwareWebsiteUrl = useEnvAwareSanityWebsiteUrl()
  const canInviteMembers = useCanInviteProjectMembers()

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
            href={`${envAwareWebsiteUrl}/manage/project/${projectId}`}
            icon={CogIcon}
            justify="flex-start"
            mode="bleed"
            size="large"
            target="_blank"
            text={t('user-menu.action.manage-project')}
          />
        </Stack>

        {canInviteMembers && (
          <Stack as="li">
            <Button
              aria-label={t('user-menu.action.invite-members-aria-label')}
              as="a"
              href={`${envAwareWebsiteUrl}/manage/project/${projectId}/members?invite=true`}
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
