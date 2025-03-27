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
    <Stack paddingX={5} paddingTop={4} paddingBottom={3}>
      <Flex align="center">
        <WorkspacePreviewIcon icon={activeWorkspace.icon} size="large" />
        <Stack marginLeft={2} gap={2}>
          <Text size={0}>{activeWorkspace.name}</Text>
          <Text size={2} weight="medium">
            {activeWorkspace.title}
          </Text>
        </Stack>
      </Flex>

      <Flex justify="flex-start" gap={3} paddingTop={4}>
        <Button
          mode="bleed"
          as="a"
          href={`https://sanity.io/manage/project/${projectId}`}
          target="_blank"
          icon={CogIcon}
          tooltipProps={{content: t('user-menu.action.manage-project-aria-label')}}
          text={t('user-menu.action.manage-project-aria-label')}
          // @ts-expect-error -- Custom CSS property for Button component, needs to be unset so the border works as default
          style={{'--card-border-color': 'unset'}}
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
            // @ts-expect-error -- Custom CSS property for Button component, needs to be unset so the border works as default
            style={{'--card-border-color': 'unset'}}
          />
        )}
      </Flex>
    </Stack>
  )
}
