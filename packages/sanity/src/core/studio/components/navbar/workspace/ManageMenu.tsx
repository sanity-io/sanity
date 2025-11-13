import {AddUserIcon, CogIcon} from '@sanity/icons'
import {Flex, Stack, Text} from '@sanity/ui'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n'
import {useProject} from '../../../../store/_legacy/project/useProject'
import {userHasRole} from '../../../../util/userHasRole'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher/useActiveWorkspace'
import {useEnvAwareSanityWebsiteUrl} from '../../../hooks/useEnvAwareSanityWebsiteUrl'
import {useWorkspace} from '../../../workspace'
import {WorkspacePreviewIcon} from './WorkspacePreview'

import {useGrantsStore} from 'sanity'
import {useObservable} from 'react-rx'

interface ManageMenuProps {
  multipleWorkspaces: boolean
  canInviteMembers: boolean
}

export function ManageMenu(props: ManageMenuProps) {
  const {multipleWorkspaces, canInviteMembers} = props
  const {projectId, currentUser} = useWorkspace()
  const {value: project} = useProject()
  const {activeWorkspace} = useActiveWorkspace()
  const isAdmin = Boolean(currentUser && userHasRole(currentUser, 'administrator'))
  const envAwareWebsiteUrl = useEnvAwareSanityWebsiteUrl()

  const {t} = useTranslation()

  return (
    <Stack paddingX={4} paddingTop={4} paddingBottom={multipleWorkspaces ? 3 : 4}>
      <Flex align="center">
        <WorkspacePreviewIcon icon={activeWorkspace.icon} size="large" />
        <Stack marginLeft={2} space={2}>
          <Text size={0}>{project?.displayName}</Text>
          <Text size={2} weight="medium">
            {activeWorkspace.title}
          </Text>
        </Stack>
      </Flex>

      <Flex justify="flex-start" gap={3} paddingTop={4}>
        <Button
          mode="bleed"
          as="a"
          href={`${envAwareWebsiteUrl}/manage/project/${projectId}`}
          target="_blank"
          icon={CogIcon}
          tooltipProps={{content: t('user-menu.action.manage-project-aria-label')}}
          text={t('user-menu.action.manage-project-aria-label')}
          // @ts-expect-error -- Custom CSS property for Button component, needs to be unset so the border works as default
          style={{'--card-border-color': 'unset'}}
        />
        {canInviteMembers && (
          <Button
            mode="bleed"
            as="a"
            href={`${envAwareWebsiteUrl}/manage/project/${projectId}/members?invite=true`}
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
