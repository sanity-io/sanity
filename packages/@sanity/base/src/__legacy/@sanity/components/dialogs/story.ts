import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {DefaultStory} from './stories/default'
import {DialogContentStory} from './stories/dialogContent'
import {FullscreenStory} from './stories/fullscreen'
import {PopoverStory} from './stories/popover'
import {NestedStory} from './stories/nested'
import {ConfirmStory} from './stories/confirm'

storiesOf('@sanity/components/dialogs', module)
  .addDecorator(withKnobs)
  .add('Default', DefaultStory)
  .add('DialogContent', DialogContentStory)
  .add('Fullscreen', FullscreenStory)
  .add('PopOver', PopoverStory)
  .add('Confirm', ConfirmStory)
  .add('Nested', NestedStory)
