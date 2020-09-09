import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {CollapsibleStory} from './stories/collapsible'
import {ColumnsStory} from './stories/columns'
import {DefaultStory} from './stories/default'
import {DeeplyNestedStory} from './stories/deeplyNested'
import {NestedStory} from './stories/nested'

storiesOf('@sanity/components/fieldsets', module)
  .addDecorator(withKnobs)
  .add('Default', DefaultStory)
  .add('Nested (demo)', NestedStory)
  .add('Deeply nested (demo)', DeeplyNestedStory)
  .add('Collapsible (demo)', CollapsibleStory)
  .add('Columns (demo)', ColumnsStory)
