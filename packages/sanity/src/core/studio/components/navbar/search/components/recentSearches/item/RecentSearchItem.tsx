import {ClockIcon} from '@sanity/icons/Clock'
import {CloseIcon} from '@sanity/icons/Close'
import {useTelemetry} from '@sanity/telemetry/react'
import {
  // oxlint-disable-next-line no-restricted-imports
  Button, // Button with specific styling and children behavior.
  rem,
  useTheme_v2 as useThemeV2,
} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type MouseEvent, useCallback, type CSSProperties} from 'react'
import {Text, Box, Flex, type MarginProps, type PaddingProps, Icon} from 'ui5'

import {RecentSearchClicked} from '../../../__telemetry__/search.telemetry'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {type RecentSearch, useRecentSearchesStore} from '../../../datastores/recentSearches'
import {DocumentTypesPill} from '../../common/DocumentTypesPill'
import {FilterPill} from '../../common/FilterPill'
import {
  closeButtonDiv,
  radius2Var,
  recentSearchItemButton,
  searchItemPillsBox,
  searchItemQueryFlex,
} from './RecentSearchItem.css'

export interface RecentSearchesProps extends MarginProps, PaddingProps {
  index: number
  maxVisibleTypePillChars?: number
  value: RecentSearch
}

const DEFAULT_COMBINED_TYPE_COUNT = 40

function CloseButtonDiv(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(closeButtonDiv, className)} />
}

export function RecentSearchItem({
  index,
  maxVisibleTypePillChars = DEFAULT_COMBINED_TYPE_COUNT,
  value,
  ...rest
}: RecentSearchesProps) {
  const {dispatch} = useSearchState()
  const recentSearchesStore = useRecentSearchesStore()
  const telemetry = useTelemetry()
  const {radius} = useThemeV2()

  // Determine how many characters are left to render type pills
  const availableCharacters = maxVisibleTypePillChars - value.query.length

  const handleClick = useCallback(() => {
    dispatch({type: 'TERMS_SET', filters: value?.filters, terms: value})

    // Add to Local Storage
    if (recentSearchesStore) {
      recentSearchesStore?.addSearch(value, value?.filters)
    }

    telemetry.log(RecentSearchClicked)
  }, [dispatch, recentSearchesStore, telemetry, value])

  const handleDelete = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation()
      // Remove from Local Storage
      if (recentSearchesStore) {
        recentSearchesStore?.removeSearchAtIndex(index)
      }
    },
    [index, recentSearchesStore],
  )

  return (
    <Box {...rest}>
      <Button
        className={recentSearchItemButton}
        data-recent-search-item=""
        mode="bleed"
        onClick={handleClick}
        paddingLeft={3}
        paddingRight={1}
        paddingY={1}
        style={{[radius2Var]: `${rem(radius[2])}`} as CSSProperties}
        tabIndex={-1}
      >
        <Flex alignItems="stretch">
          {/* Combination of <Flex> and a zero-width character to ensure icon is optically aligned with adjacent text */}
          <Flex alignItems="flex-start" paddingY={2}>
            <Icon muted size={1} icon={ClockIcon} style={{margin: '-0.3125rem -0.375rem'}} />
            <Text as="div" trim={true}>
              &#8203;
            </Text>
          </Flex>

          <Flex
            alignItems="stretch"
            flexBasis="0%"
            flexGrow={1}
            gap={2}
            justifyContent="flex-start"
            marginLeft={3}
            flexWrap="wrap"
          >
            {/* Text query */}
            {value.query && (
              <Flex alignItems="center" className={searchItemQueryFlex} paddingY={2}>
                <Text
                  muted
                  size={1}
                  truncate={1}
                  weight="medium"
                  as="div"
                  trim={true}
                  style={{maxWidth: '100%'}}
                >
                  {value.query}
                </Text>
              </Flex>
            )}
            {/* Document type */}
            {value.types.length > 0 && (
              <Box className={searchItemPillsBox}>
                <DocumentTypesPill availableCharacters={availableCharacters} types={value.types} />
              </Box>
            )}
            {/* Filters */}
            {value?.filters?.map((filter, i) => {
              // oxlint-disable-next-line no-array-index-key
              return <FilterPill key={i} filter={filter} />
            })}
          </Flex>

          {/* TODO: this is neither semantic nor accessible, consider revising */}
          <Flex alignItems="center">
            <CloseButtonDiv onClick={handleDelete}>
              <Flex padding={2}>
                <Icon size={1} icon={CloseIcon} style={{margin: '-0.375rem'}} />
              </Flex>
            </CloseButtonDiv>
          </Flex>
        </Flex>
      </Button>
    </Box>
  )
}
