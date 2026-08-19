import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ComponentType} from 'react'

import {type BaseFieldProps} from '../types/fieldProps'
import {pathToAnchorIdent} from '../utils/pathToAnchorIdent'
import {FormBaseVariantDiffIndicator} from './FormBaseVariantDiffIndicator'
import {FormDivergenceIndicator} from './FormDivergenceIndicator'
import {formFieldAnchor, formFieldAnchorPath} from './FormFieldAnchor.css'

/**
 * @internal
 */
export type FormFieldGutterProps = Pick<BaseFieldProps, 'path' | 'changedFromBaseVariant'>

/**
 * The contents of the form field start gutter.
 *
 * @internal
 */
export const FormFieldGutter: ComponentType<FormFieldGutterProps> = ({
  path,
  changedFromBaseVariant,
}) => (
  <div
    className={formFieldAnchor}
    style={assignInlineVars({[formFieldAnchorPath]: pathToAnchorIdent('input', path)})}
  >
    <FormDivergenceIndicator path={path} />
    <FormBaseVariantDiffIndicator changedFromBaseVariant={changedFromBaseVariant} />
  </div>
)
