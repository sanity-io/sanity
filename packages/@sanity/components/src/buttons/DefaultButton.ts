import createButtonLike from './createButtonLike'
import {ButtonProps} from './types'

export {ButtonProps}

export default createButtonLike('button', {
  displayName: 'DefaultButton',
  defaultProps: {type: 'button'}
})
