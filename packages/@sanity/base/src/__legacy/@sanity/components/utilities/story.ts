import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {ActivateOnFocusStory} from './stories/activateOnFocus'

storiesOf('@sanity/components/utilities', module)
  .addDecorator(withKnobs)
  .add('Activate on focus', ActivateOnFocusStory)
