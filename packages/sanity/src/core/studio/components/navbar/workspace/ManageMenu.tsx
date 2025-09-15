import {AddUserIcon, CogIcon} from '@sanity/icons'
import {Flex, Stack, Text} from '@sanity/ui'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n'
import {userHasRole} from '../../../../util/userHasRole'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher/useActiveWorkspace'
import {useWorkspace} from '../../../workspace'
import {WorkspacePreviewIcon} from './WorkspacePreview'

export function ManageMenu() {
  const {projectId, currentUser} = useWorkspace()
  const {activeWorkspace} = useActiveWorkspace()
  const isAdmin = Boolean(currentUser && userHasRole(currentUser, 'administrator'))

  const {t} = useTranslation()

  return (
    <Stack paddingX={5} paddingTop={4}>
      <Flex paddingBottom={2} align="center">
        <WorkspacePreviewIcon icon={activeWorkspace.icon} size="large" />
        <Stack marginLeft={2} space={2}>
          <Text size={0}>{activeWorkspace.name}</Text>
          <Text size={2} weight="medium">
            {activeWorkspace.title}
          </Text>
        </Stack>
      </Flex>

      <Flex justify="space-between" align="center" gap={2} paddingBottom={2}>
        <Button
          mode="bleed"
          as="a"
          href={`https://sanity.io/manage/project/${projectId}`}
          target="_blank"
          icon={CogIcon}
          tooltipProps={{content: t('user-menu.action.manage-project-aria-label')}}
          text={t('user-menu.action.manage-project-aria-label')}
          style={{border: '1px solid #ECECEF'}}
        />
        {isAdmin && (
          <Button
            mode="bleed"
            as="a"
            href={`https://www.sanity.io/manage/project/${projectId}/members?invite=true`}
            target="_blank"
            icon={AddUserIcon}
            tooltipProps={{content: t('user-menu.action.invite-members')}}
            text={t('user-menu.action.invite-members')}
            style={{border: '1px solid #ECECEF'}}
          />
        )}
      </Flex>
    </Stack>
  )
}
