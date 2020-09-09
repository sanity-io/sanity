import createButtonLike from './createButtonLike'
import {ButtonColor, ButtonProps} from './types'

export {ButtonColor, ButtonProps}

export default createButtonLike('button', {
  displayName: 'DefaultButton',
  defaultProps: {type: 'button'}
})
