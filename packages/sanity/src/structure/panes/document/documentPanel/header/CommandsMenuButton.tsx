import {ShareIcon} from '@sanity/icons/Share'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {Fragment, type ReactNode, useId} from 'react'
import {ContextMenuButton, useTranslation} from 'sanity'

import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {PaneMenuButtonItem} from '../../../../components/pane/PaneMenuButtonItem'
import {type _PaneMenuNode} from '../../../../components/pane/types'
import {structureLocaleNamespace} from '../../../../i18n'
import {useCopyDocumentActions} from './CopyDocumentActions'

/**
 * PROPOSED (open beta header): the "..." menu as commands only, in groups separated by dividers: pane commands (Compare versions, Inspect),
 * document commands (Copy and Paste document), then the document actions (Create new task) and Share. Panels that read beside the form are
 * inspector tabs, so they are not in it. Used only while the host sets `compactHeader`.
 *
 * @internal
 */
export function CommandsMenuButton(props: {groups: _PaneMenuNode[][]; actionsNodes?: ReactNode}) {
  const {groups, actionsNodes} = props
  const id = useId()
  const {t} = useTranslation(structureLocaleNamespace)
  const {contextAwareDocumentId, handleCopyLink} = useCopyDocumentActions()
  const shown = groups.filter((group) => group.length > 0)

  return (
    <MenuButton
      button={<ContextMenuButton data-testid="pane-context-menu-button" />}
      id={id}
      menu={
        <Menu>
          {shown.map((group, groupIndex) => (
            <Fragment key={group[0].key}>
              {groupIndex > 0 && <MenuDivider />}
              {group.map((node) => (
                <PaneMenuButtonItem isAfterGroup={false} key={node.key} node={node} />
              ))}
            </Fragment>
          ))}
          {shown.length > 0 && (actionsNodes || contextAwareDocumentId) && <MenuDivider />}
          {actionsNodes}
          {contextAwareDocumentId && (
            <MenuItem
              data-testid="share-document"
              icon={ShareIcon}
              onClick={handleCopyLink}
              text={t('action.share-document.label')}
            />
          )}
        </Menu>
      }
      popover={{constrainSize: true, placement: 'bottom', portal: true}}
    />
  )
}
