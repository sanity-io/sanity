import {CheckmarkIcon, ChevronDownIcon, DoubleChevronRightIcon} from '@sanity/icons'
import {Card, Flex, Menu, Text} from '@sanity/ui'
import React, {forwardRef, useCallback} from 'react'
import styled from 'styled-components'
import {Button, MenuButton, MenuItem} from '../../../../ui-components'
import {commentsLocaleNamespace} from '../../i18n'
import {CommentStatus} from '../../src'
import {BetaBadge, useTranslation} from 'sanity'

const Root = styled(Card)({
  position: 'relative',
  zIndex: 1,
  lineHeight: 0,
})

interface CommentsInspectorHeaderProps {
  onClose: () => void
  onViewChange: (view: CommentStatus) => void
  view: CommentStatus
}

export const CommentsInspectorHeader = forwardRef(function CommentsInspectorHeader(
  props: CommentsInspectorHeaderProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {t} = useTranslation(commentsLocaleNamespace)
  const {onClose, onViewChange, view} = props

  const handleSetOpenView = useCallback(() => onViewChange('open'), [onViewChange])
  const handleSetResolvedView = useCallback(() => onViewChange('resolved'), [onViewChange])

  return (
    <Root ref={ref}>
      <Flex padding={2}>
        <Flex align="center" flex={1} gap={2} paddingY={2} padding={3}>
          <Text as="h1" size={1} weight="medium">
            {t('header-title')}
          </Text>

          <BetaBadge />
        </Flex>

        <Flex flex="none" padding={1} gap={2}>
          <MenuButton
            id="comment-status-menu-button"
            button={
              <Button
                text={view === 'open' ? t('dropdown-title-open') : t('dropdown-title-resolved')}
                mode="bleed"
                iconRight={ChevronDownIcon}
              />
            } //this startcase needs to be fixed
            menu={
              <Menu style={{width: '180px'}}>
                <MenuItem
                  iconRight={view === 'open' ? CheckmarkIcon : undefined}
                  onClick={handleSetOpenView}
                  text={t('dropdown-item-open')}
                />
                <MenuItem
                  iconRight={view === 'resolved' ? CheckmarkIcon : undefined}
                  onClick={handleSetResolvedView}
                  text={t('dropdown-item-resolved')}
                />
              </Menu>
            }
            popover={{placement: 'bottom-end'}}
          />

          <Button
            aria-label={t('button-close-pane-text-aria-label')}
            icon={DoubleChevronRightIcon}
            mode="bleed"
            onClick={onClose}
            tooltipProps={{content: t('button-close-pane-text')}}
          />
        </Flex>
      </Flex>
    </Root>
  )
})
