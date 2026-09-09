import {AddUserIcon} from '@sanity/icons/AddUser'
import {CogIcon} from '@sanity/icons/Cog'
import {Stack, Text, TextSkeleton} from '@sanity/ui'
import {Suspense, use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {Flex} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher/useActiveWorkspace'
import {useEnvAwareSanityWebsiteUrl} from '../../../hooks/useEnvAwareSanityWebsiteUrl'
import {useWorkspace} from '../../../workspace'
import {useCanInviteProjectMembers} from '../useCanInviteMembers'
import {WorkspacePreviewIcon} from './WorkspacePreview'

function ProjectName({promise}: {promise: ObservablePromise<string | null>}) {
  const name = use(promise)
  return name ? <Text size={0}>{name}</Text> : null
}

export function ManageMenu({
  multipleWorkspaces,
  projectNamePromise,
}: {
  multipleWorkspaces: boolean
  projectNamePromise: ObservablePromise<string | null>
}) {
  const {projectId} = useWorkspace()
  const {activeWorkspace} = useActiveWorkspace()
  const envAwareWebsiteUrl = useEnvAwareSanityWebsiteUrl()

  const canInviteMembers = useCanInviteProjectMembers()

  const {t} = useTranslation()

  return (
    <Stack paddingX={4} paddingTop={4} paddingBottom={multipleWorkspaces ? 3 : 4}>
      <Flex alignItems="center">
        <WorkspacePreviewIcon icon={activeWorkspace.icon} size="large" />
        <Stack marginLeft={2} gap={2}>
          <Suspense fallback={<TextSkeleton size={0} animated style={{width: '8ch'}} />}>
            <ProjectName promise={projectNamePromise} />
          </Suspense>
          <Text size={2} weight="medium">
            {activeWorkspace.title}
          </Text>
        </Stack>
      </Flex>

      <Flex justifyContent="flex-start" gap={3} paddingTop={4}>
        <Button
          mode="bleed"
          as="a"
          href={`${envAwareWebsiteUrl}/manage/project/${projectId}`}
          target="_blank"
          icon={CogIcon}
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
            text={t('user-menu.action.invite-members')}
            // @ts-expect-error -- Custom CSS property for Button component, needs to be unset so the border works as default
            style={{'--card-border-color': 'unset'}}
          />
        )}
      </Flex>
    </Stack>
  )
}
