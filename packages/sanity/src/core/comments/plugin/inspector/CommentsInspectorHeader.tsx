import {CheckmarkIcon, ChevronDownIcon, CloseIcon} from '@sanity/icons'
import {Card, Flex, Menu, Text} from '@sanity/ui'
import {forwardRef, useCallback} from 'react'
import {styled} from 'styled-components'

import {Button, MenuButton, MenuItem} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentStatus, type CommentsUIMode} from '../../types'

const Root = styled(Card)({
  position: 'relative',
  zIndex: 1,
  lineHeight: 0,
})

interface CommentsInspectorHeaderProps {
  onClose: () => void
  onViewChange: (view: CommentStatus) => void
  view: CommentStatus
  mode: CommentsUIMode
}

export const CommentsInspectorHeader = forwardRef(function CommentsInspectorHeader(
  props: CommentsInspectorHeaderProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {t} = useTranslation(commentsLocaleNamespace)
  const {onClose, onViewChange, view, mode} = props

  const handleSetOpenView = useCallback(() => onViewChange('open'), [onViewChange])
  const handleSetResolvedView = useCallback(() => onViewChange('resolved'), [onViewChange])

  return (
    <Root ref={ref}>
      <Flex padding={2}>
        <Flex align="center" flex={1} gap={2} paddingY={2} padding={3}>
          <Text as="h1" size={1} weight="medium">
            {t('feature-name')}
          </Text>
        </Flex>

        <Flex flex="none" padding={1} gap={2}>
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
    </Root>
  )
})
