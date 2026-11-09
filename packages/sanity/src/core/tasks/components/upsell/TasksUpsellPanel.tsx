import {Container, Box} from 'ui5'

import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useTasksUpsell} from '../../context/upsell/useTasksUpsell'

/** The upsell panel at the top of the tasks sidebar in upsell mode */
export function TasksUpsellPanel() {
  const upsell = useTasksUpsell()

  return (
    <Container size={1}>
      <Box marginBottom={6}>
        <UpsellPanel upsell={upsell} />
      </Box>
    </Container>
  )
}
