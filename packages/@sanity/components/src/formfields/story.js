import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {DefaultFormFieldStory} from './stories/default'

storiesOf('@sanity/components/formfields', module)
  .addDecorator(withKnobs)
  .add('Default', DefaultFormFieldStory)
