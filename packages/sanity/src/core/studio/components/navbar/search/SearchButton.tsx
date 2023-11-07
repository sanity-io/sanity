/* eslint-disable react/jsx-pascal-case */
import {SearchIcon} from '@sanity/icons'
import {Flex, KBD, Text} from '@sanity/ui'
import React, {forwardRef} from 'react'
import {Button, Tooltip} from '../../../../../ui'
import {useColorScheme} from '../../../colorScheme'
import {GLOBAL_SEARCH_KEY, GLOBAL_SEARCH_KEY_MODIFIER} from './constants'

interface SearchButtonProps {
  onClick: () => void
}

/**
 * @internal
 */
export const SearchButton = forwardRef(function SearchButton(
  {onClick}: SearchButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const {scheme} = useColorScheme()

  return (
    <Tooltip
      scheme={scheme}
      placement="bottom"
      portal
      content={
        <Flex align="center" gap={3}>
          <Text size={1}>Search</Text>
          <Flex gap={1}>
            <KBD>{GLOBAL_SEARCH_KEY_MODIFIER}</KBD>
            <KBD>{GLOBAL_SEARCH_KEY.toUpperCase()}</KBD>
          </Flex>
        </Flex>
      }
    >
      <Button
        aria-label="Open search"
        data-testid="studio-search"
        icon={SearchIcon}
        onClick={onClick}
        mode="bleed"
        ref={ref}
      />
    </Tooltip>
  )
})
