import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ComponentType} from 'react'

import {type BaseFieldProps} from '../types/fieldProps'
import {pathToAnchorIdent} from '../utils/pathToAnchorIdent'
import {FormBaseVariantDiffIndicator} from './FormBaseVariantDiffIndicator'
import {FormDivergenceIndicator} from './FormDivergenceIndicator'
import {formFieldAnchor, formFieldAnchorPath} from './FormFieldAnchor.css'
import {formFieldGutter} from './FormFieldGutter.css'

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
}) => {
  // `FormField` and `FormFieldSet` are exported from `sanity`, and `path` only became a required
  // prop in v5.17. Custom inputs written before that still render them without one, so the gutter
  // must tolerate a missing path instead of letting `pathToAnchorIdent` throw and take down the
  // whole form. Without a path there is nothing to anchor to and no divergence to look up.
  const hasPath = Array.isArray(path)

  return (
    <div
      data-testid="form-field-gutter"
      className={hasPath ? `${formFieldAnchor} ${formFieldGutter}` : formFieldGutter}
      style={
        hasPath
          ? assignInlineVars({[formFieldAnchorPath]: pathToAnchorIdent('input', path)})
          : undefined
      }
    >
      {hasPath && <FormDivergenceIndicator path={path} />}
      <FormBaseVariantDiffIndicator changedFromBaseVariant={changedFromBaseVariant} />
    </div>
  )
}
