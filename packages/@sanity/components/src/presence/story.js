import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {CirclesStory} from './stories/circles'
import {CircleStory} from './stories/circle'
import {ListStory} from './stories/list'
import {ColorHasherStory} from './stories/colorHasher'

storiesOf('@sanity/components/presence', module)
  .addDecorator(withKnobs)
  .add('Circles', CirclesStory)
  .add('Circle', CircleStory)
  .add('List', ListStory)
  .add('colorHasher', ColorHasherStory)
