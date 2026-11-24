import {BookmarkIcon} from '@sanity/icons/Bookmark'
import {CodeIcon} from '@sanity/icons/Code'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {Button} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import {Tooltip} from '@sanity/ui/tooltip'
import {type RefAttributes, useCallback, useState} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Text} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type QueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {useSaveCurrentQuery} from '../../hooks/useSaveCurrentQuery'
import {type QueryRequest, type VisionTab} from '../../store/types'
import {usePendingEdits} from '../../store/VisionActorContext'
import {ExportQueryDialog} from './ExportQueryDialog'

export interface QueryActionsMenuProps {
  tab: VisionTab
  request: QueryRequest | null
  buildRequest: QueryRequestBuilder['buildRequest']
  resolved: ResolvedRequest
}

export function QueryActionsMenu(props: QueryActionsMenuProps) {
  const {tab, request, buildRequest, resolved} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const pendingEdits = usePendingEdits()
  const [exportOpen, setExportOpen] = useState(false)
  const {saveCurrent, canSave} = useSaveCurrentQuery(tab, {request, buildRequest})

  const openExport = useCallback(() => {
    // Params typed within the debounce window belong to the exported request; committing them
    // re-renders the dialog with the request built from them
    pendingEdits.commit()
    setExportOpen(true)
  }, [pendingEdits])

  return (
    <>
      <MenuButton
        button={
          <MoreActionsButton
            aria-label={t('vision.query.actions')}
            data-testid="vision-query-menu-button"
          />
        }
        id={`vision-query-menu-${tab.id}`}
        menu={
          <Menu>
            <MenuItem
              data-testid="vision-export-query"
              disabled={!request}
              icon={CodeIcon}
              onClick={openExport}
              text={t('vision.query.export')}
            />
            <MenuItem
              data-testid="vision-save-query"
              disabled={!canSave}
              icon={BookmarkIcon}
              onClick={() => void saveCurrent()}
              text={t('vision.query.save')}
            />
          </Menu>
        }
        popover={{animate: true, portal: true, placement: 'top-end'}}
      />
      {exportOpen && request && (
        <ExportQueryDialog
          onClose={() => setExportOpen(false)}
          request={request}
          resolved={resolved}
          tab={tab}
        />
      )}
    </>
  )
}

/**
 * The `...` button with its tooltip. `MenuButton` clones the element it is given to attach its
 * handlers, so the props go to the inner button rather than to the tooltip
 */
function MoreActionsButton(
  props: {'aria-label': string; 'data-testid'?: string} & RefAttributes<HTMLButtonElement>,
) {
  const {ref, ...rest} = props
  const {t} = useTranslation(visionLocaleNamespace)

  return (
    <Tooltip
      animate
      content={
        <Text as="div" size={1} trim={true}>
          {t('vision.actions.more')}
        </Text>
      }
      placement="top"
      portal
    >
      <Button {...rest} icon={EllipsisHorizontalIcon} mode="bleed" padding={2} ref={ref} />
    </Tooltip>
  )
}
