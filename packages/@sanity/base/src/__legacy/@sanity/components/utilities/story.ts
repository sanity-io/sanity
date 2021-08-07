// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {ActivateOnFocusStory} from './stories/activateOnFocus'

storiesOf('@sanity/components/utilities', module)
  .addDecorator(withKnobs)
  .add('Activate on focus', ActivateOnFocusStory)
