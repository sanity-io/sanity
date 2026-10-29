import {Box, Text} from 'ui5'

import {useTranslation} from '../../i18n/hooks/useTranslation'

export function FilterNoMatches(props: {filter: string}) {
  const {t} = useTranslation()

  return (
    <Box data-testid="perspective-filter-no-matches" padding={3}>
      <Text muted size={1}>
        {t('navbar.filter.no-matches', {filter: props.filter})}
      </Text>
    </Box>
  )
}
