import ReactDOM from 'react-dom'

import {ModernPortal} from './ModernPortal'
import {LegacyPortal} from './LegacyPortal'

export const Portal = ReactDOM.createPortal ? ModernPortal : LegacyPortal
