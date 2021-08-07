// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {DefaultStory} from './stories/default'
import {ButtonStory} from './stories/button'

storiesOf('@sanity/components/fileinput', module)
  .addDecorator(withKnobs)
  .add('Default', DefaultStory)
  .add('Button', ButtonStory)
