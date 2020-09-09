import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {DefaultStory} from './stories/default'
import {DefaultWithValueStory} from './stories/defaultWithValue'
import {SearchableStory} from './stories/searchable'
import {StyleSelectStory} from './stories/styleSelect'
import {RadioButtonsStory} from './stories/radioButtons'

storiesOf('@sanity/components/selects', module)
  .addDecorator(withKnobs)
  .add('Default', DefaultStory)
  .add('Default with value', DefaultWithValueStory)
  .add('Searchable', SearchableStory)
  .add('Style select', StyleSelectStory)
  .add('Radiobuttons', RadioButtonsStory)
