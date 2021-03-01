import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {DefaultStory} from './stories/default'
import {StackStory} from './stories/stack'

storiesOf('@sanity/components/avatar', module)
  .addDecorator(withKnobs)
  .add('Default', DefaultStory)
  .add('Stack', StackStory)
