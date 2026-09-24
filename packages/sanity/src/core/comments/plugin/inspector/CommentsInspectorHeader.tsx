import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {useCallback, type RefAttributes} from 'react'
import {Text, Flex} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentStatus, type CommentsUIMode} from '../../types'
import {root} from './CommentsInspectorHeader.css'

interface CommentsInspectorHeaderProps {
  onClose: () => void
  onViewChange: (view: CommentStatus) => void
  view: CommentStatus
  mode: CommentsUIMode
}

export function CommentsInspectorHeader(
  props: CommentsInspectorHeaderProps & RefAttributes<HTMLDivElement>,
) {
  const {t} = useTranslation(commentsLocaleNamespace)
  const {ref, onClose, onViewChange, view, mode} = props

  const handleSetOpenView = useCallback(() => onViewChange('open'), [onViewChange])
  const handleSetResolvedView = useCallback(() => onViewChange('resolved'), [onViewChange])

  return (
    <Card className={root} ref={ref}>
      <Flex padding={2}>
        <Flex alignItems="center" flexBasis="0%" flexGrow={1} gap={2} paddingY={2} padding={3}>
          <Text as="h1" size={1} weight="medium" trim={true}>
            {t('feature-name')}
          </Text>
        </Flex>

        <Flex flexBasis="auto" flexGrow={0} flexShrink={0} padding={1} gap={2}>
          <MenuButton
            id="comment-status-menu-button"
            button={
              <Button
                text={
                  view === 'open'
                    ? t('status-filter.status-open')
                    : t('status-filter.status-resolved')
                }
                mode="bleed"
                iconRight={ChevronDownIcon}
              />
            }
            menu={
              <Menu style={{width: '180px'}}>
                <MenuItem
                  iconRight={view === 'open' ? CheckmarkIcon : undefined}
                  onClick={handleSetOpenView}
                  text={t('status-filter.status-open-full')}
                />
                <MenuItem
                  iconRight={view === 'resolved' ? CheckmarkIcon : undefined}
                  onClick={handleSetResolvedView}
                  text={t('status-filter.status-resolved-full')}
                  tooltipProps={
                    mode === 'upsell'
                      ? {content: t('status-filter.status-resolved-full-upsell')}
                      : undefined
                  }
                  disabled={mode === 'upsell'}
                />
              </Menu>
            }
            popover={{placement: 'bottom-end'}}
          />

          <Button
            aria-label={t('close-pane-button-text-aria-label')}
            icon={CloseIcon}
            mode="bleed"
            onClick={onClose}
            tooltipProps={{content: t('close-pane-button-text')}}
          />
        </Flex>
      </Flex>
    </Card>
  )
}
