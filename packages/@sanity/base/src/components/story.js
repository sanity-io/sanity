import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {DefaultFormFieldStory} from './stories/appLoadingScreen'

storiesOf('@sanity/base', module)
  .addDecorator(withKnobs)
  .add('<AppLoadingScreen />', DefaultFormFieldStory)
