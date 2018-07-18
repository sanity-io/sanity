import {throwError} from 'rxjs'

export default () => throwError(new Error('Well that certainly failed.'))
