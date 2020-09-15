import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {BoundaryStory} from './stories/boundary'
import {DefaultStory} from './stories/default'
import {InteractiveStory} from './stories/interactive'
import {MoveRefStory} from './stories/moveRef'

storiesOf('@sanity/components/popover', module)
  .addDecorator(withKnobs)
  .add('Default', DefaultStory)
  .add('Move reference', MoveRefStory)
  .add('Interactive', InteractiveStory)
  .add('Boundary', BoundaryStory)
