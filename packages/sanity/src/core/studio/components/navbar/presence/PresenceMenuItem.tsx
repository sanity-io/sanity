import React, {forwardRef, memo, useCallback, useEffect, useMemo, useState} from 'react'
import {orderBy} from 'lodash'
import * as PathUtils from '@sanity/util/paths'
import {GlobalPresence} from '../../../../store'
import {UserAvatar} from '../../../../components'
import {MenuItem} from '../../../../../ui'
import {useTranslation} from '../../../../i18n'
import {IntentLink} from 'sanity/router'

interface PresenceListRowProps {
  focused: boolean
  onFocus: (id: string) => void
  presence: GlobalPresence
}

export const PresenceMenuItem = memo(function PresenceMenuItem(props: PresenceListRowProps) {
  const {presence, focused, onFocus} = props
  const [menuItemElement, setMenuItemElement] = useState<HTMLElement | null>(null)
  const {t} = useTranslation()

  const lastActiveLocation = orderBy(presence.locations || [], ['lastActiveAt'], ['desc']).find(
    (location) => location.documentId,
  )
  const hasLink = Boolean(lastActiveLocation?.documentId)

  /**
   * This is a workaround to keep focus on the selected menu item
   * when the list of users in the menu is updated
   */
  useEffect(() => {
    if (focused && menuItemElement) {
      menuItemElement.focus()
      menuItemElement.setAttribute('data-selected', '')
    }

    if (!focused) {
      menuItemElement?.removeAttribute('data-selected')
    }
  }, [menuItemElement, focused])

  const handleFocus = useCallback(() => {
    onFocus(presence.user.id)
  }, [onFocus, presence.user.id])

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        if (!lastActiveLocation?.path) return null

        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{
              id: lastActiveLocation?.documentId,
              path: PathUtils.toString(lastActiveLocation?.path),
            }}
            ref={ref}
          />
        )
      }),
    [lastActiveLocation],
  )

  return (
    <MenuItem
      as={lastActiveLocation ? LinkComponent : 'div'}
      data-as="a"
      disabled={!hasLink}
      onFocus={handleFocus}
      preview={
        <UserAvatar
          key={presence.user.id}
          size={1}
          user={presence.user}
          status={hasLink ? 'editing' : 'inactive'}
        />
      }
      ref={setMenuItemElement}
      text={presence.user.displayName}
      tooltipProps={hasLink ? undefined : {content: t('presence.not-in-a-document')}}
    />
  )
})
