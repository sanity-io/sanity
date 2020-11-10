import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {SwitchStory} from './stories/switch'
import {CheckboxStory} from './stories/checkbox'
import {ButtonsStory} from './stories/buttons'
import {ToggleButtonStory} from './stories/toggleButton'
import {ToggleButtonCollectionStory} from './stories/toggleButtonCollectionStory'

storiesOf('@sanity/components/toggles', module)
  .addDecorator(withKnobs)
  .add('Switch', SwitchStory)
  .add('Checkbox', CheckboxStory)
  .add('Buttons', ButtonsStory)
  .add('Toggle button', ToggleButtonStory)
  .add('Toggle button collection', ToggleButtonCollectionStory)
