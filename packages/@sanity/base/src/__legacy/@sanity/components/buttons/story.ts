import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {AnchorStory} from './stories/anchor'
import {DefaultStory} from './stories/default'
import {DropDownStory} from './stories/dropDown'
import {ExamplesStory} from './stories/examples'
import {FileInputStory} from './stories/fileInput'
import {GridStory} from './stories/grid'
import {GroupStory} from './stories/group'

storiesOf('@sanity/components/buttons', module)
  .addDecorator(withKnobs)
  .add('<DefaultButton />', DefaultStory)
  .add('<AnchorButton />', AnchorStory)
  .add('<DropDownButton />', DropDownStory)
  .add('<FileInputButton />', FileInputStory)
  .add('<ButtonGrid />', GridStory)
  .add('<ButtonGroup />', GroupStory)
  .add('Various examples', ExamplesStory)
