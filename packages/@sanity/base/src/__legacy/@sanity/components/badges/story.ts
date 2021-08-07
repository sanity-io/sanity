// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {AllVersionsStory} from './stories/allVersions'
import {DefaultStory} from './stories/default'
import {ExampleInTextStory} from './stories/exampleInText'

storiesOf('@sanity/components/badges', module)
  .addDecorator(withKnobs)
  .add('<DefaultBadge />', DefaultStory)
  .add('All versions', AllVersionsStory)
  .add('Example in text', ExampleInTextStory)
