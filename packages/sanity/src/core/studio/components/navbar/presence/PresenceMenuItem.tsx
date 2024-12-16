import * as PathUtils from '@sanity/util/paths'
import {orderBy} from 'lodash'
import {memo, useCallback, useEffect, useState} from 'react'
import {IntentLink} from 'sanity/router'

import {MenuItem} from '../../../../../ui-components'
import {UserAvatar} from '../../../../components'
import {useTranslation} from '../../../../i18n'
import {type GlobalPresence} from '../../../../store'

interface PresenceListRowProps {
  focused: boolean
  onFocus: (id: string) => void
  locations: GlobalPresence['locations']
  user: GlobalPresence['user']
}

export const PresenceMenuItem = memo(function PresenceMenuItem(props: PresenceListRowProps) {
  const {locations, user, focused, onFocus} = props
  const [menuItemElement, setMenuItemElement] = useState<HTMLElement | null>(null)
  const {t} = useTranslation()

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
    onFocus(user.id)
  }, [onFocus, user.id])

  const lastActiveLocation = orderBy(locations || [], ['lastActiveAt'], ['desc']).find(
    (location) => location.documentId,
  )
  const hasLink = Boolean(lastActiveLocation?.documentId)

  if (lastActiveLocation) {
    return (
      <MenuItem
        as={IntentLink}
        // @ts-expect-error - `intent` is valid when using `IntentLink`
        intent="edit"
        params={{
          id: lastActiveLocation.documentId,
          path: PathUtils.toString(lastActiveLocation.path),
        }}
        // Shared props
        data-as="a"
        onFocus={handleFocus}
        preview={<UserAvatar size={1} user={user} />}
        ref={setMenuItemElement}
        text={user.displayName}
      />
    )
  }

  return (
    <MenuItem
      as="div"
      disabled={!hasLink}
      tooltipProps={
        hasLink ? undefined : {content: t('presence.not-in-a-document'), placement: 'left'}
      }
      // Shared props
      data-as="a"
      onFocus={handleFocus}
      preview={<UserAvatar size={1} user={user} />}
      ref={setMenuItemElement}
      text={user.displayName}
    />
  )
})
