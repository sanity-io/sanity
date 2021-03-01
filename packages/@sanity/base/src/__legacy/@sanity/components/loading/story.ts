import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'
import {SpinnerStory} from './stories/spinner'

storiesOf('@sanity/components/loading', module).addDecorator(withKnobs).add('Spinner', SpinnerStory)
