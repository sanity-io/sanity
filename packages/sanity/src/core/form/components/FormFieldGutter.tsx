import {type ComponentType} from 'react'

import {type BaseFieldProps} from '../types/fieldProps'
import {FormDivergenceIndicator} from './FormDivergenceIndicator'

/**
 * @internal
 */
export type FormFieldGutterProps = Pick<BaseFieldProps, 'path'>

/**
 * The contents of the form field start gutter.
 *
 * @internal
 */
export const FormFieldGutter: ComponentType<FormFieldGutterProps> = ({path}) => (
  <FormDivergenceIndicator path={path} />
)
