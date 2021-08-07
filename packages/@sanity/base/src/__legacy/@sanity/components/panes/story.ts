// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {PaneStory} from './stories/pane'
import {SplitStory} from './stories/split'

storiesOf('@sanity/components/panes', module)
  .addDecorator(withKnobs)
  .add('Pane', PaneStory)
  .add('Split', SplitStory)
