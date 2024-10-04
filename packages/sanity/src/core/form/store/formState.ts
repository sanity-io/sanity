/* eslint-disable complexity */
/* eslint-disable max-nested-callbacks */
/* eslint-disable max-statements */
/* eslint-disable camelcase, no-else-return */

import {
  type ArraySchemaType,
  type BooleanSchemaType,
  type CurrentUser,
  isArrayOfObjectsSchemaType,
  isArraySchemaType,
  isKeyedObject,
  isObjectSchemaType,
  type NumberSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
  type StringSchemaType,
  type ValidationMarker,
} from '@sanity/types'
import {resolveTypeName} from '@sanity/util/content'
import {isEqual, pathFor, startsWith, toString, trimChildPath} from '@sanity/util/paths'
import {castArray, isEqual as _isEqual} from 'lodash'

import {type FIXME} from '../../FIXME'
import {type FormNodePresence} from '../../presence'
import {EMPTY_ARRAY, EMPTY_OBJECT, isRecord} from '../../util'
import {getFieldLevel} from '../studio/inputResolver/helpers'
import {ALL_FIELDS_GROUP, MAX_FIELD_DEPTH} from './constants'
import {
  type FieldSetMember,
  type HiddenField,
  type ObjectArrayFormNode,
  type PrimitiveFormNode,
  type StateTree,
} from './types'
import {type FormFieldGroup} from './types/fieldGroup'
import {type FieldError} from './types/memberErrors'
import {
  type ArrayOfObjectsMember,
  type ArrayOfPrimitivesMember,
  type FieldMember,
  type ObjectMember,
} from './types/members'
import {
  type ArrayOfObjectsFormNode,
  type ArrayOfPrimitivesFormNode,
  type ObjectFormNode,
} from './types/nodes'
import {createMemoizer, type FunctionDecorator} from './utils/createMemoizer'
import {getCollapsedWithDefaults} from './utils/getCollapsibleOptions'
import {getId} from './utils/getId'
import {getItemType, getPrimitiveItemType} from './utils/getItemType'

type PrimitiveSchemaType = BooleanSchemaType | NumberSchemaType | StringSchemaType

interface FormStateOptions<TSchemaType, T> {
  schemaType: TSchemaType
  path: Path
  value?: T
  comparisonValue?: T | null
  changed?: boolean
  currentUser: Omit<CurrentUser, 'role'> | null
  hidden?: true | StateTree<boolean> | undefined
  readOnly?: true | StateTree<boolean> | undefined
  openPath: Path
  focusPath: Path
  presence: FormNodePresence[]
  validation: ValidationMarker[]
  fieldGroupState?: StateTree<string>
  collapsedPaths?: StateTree<boolean>
  collapsedFieldSets?: StateTree<boolean>
  // nesting level
  level: number
  changesOpen?: boolean
}

type PrepareFieldMember = <T>(props: {
  field: ObjectField
  parent: FormStateOptions<ObjectSchemaType, T> & {
    groups: FormFieldGroup[]
    selectedGroup?: FormFieldGroup
  }
  index: number
}) => ObjectMember | HiddenField | null

type PrepareObjectInputState = <T>(
  props: FormStateOptions<ObjectSchemaType, T>,
  enableHiddenCheck?: boolean,
) => ObjectFormNode | null

type PrepareArrayOfPrimitivesInputState = <T extends (boolean | string | number)[]>(
  props: FormStateOptions<ArraySchemaType, T>,
) => ArrayOfPrimitivesFormNode | null

type PrepareArrayOfObjectsInputState = <T extends {_key: string}[]>(
  props: FormStateOptions<ArraySchemaType, T>,
) => ArrayOfObjectsFormNode | null

type PrepareArrayOfObjectsMember = (props: {
  arrayItem: {_key: string}
  parent: FormStateOptions<ArraySchemaType, unknown>
  index: number
}) => ArrayOfObjectsMember

type PrepareArrayOfPrimitivesMember = (props: {
  arrayItem: unknown
  parent: FormStateOptions<ArraySchemaType, unknown>
  index: number
}) => ArrayOfPrimitivesMember

type PreparePrimitiveInputState = <TSchemaType extends PrimitiveSchemaType>(
  props: FormStateOptions<TSchemaType, unknown>,
) => PrimitiveFormNode

function isFieldEnabledByGroupFilter(
  // the groups config for the "enclosing object" type
  groupsConfig: FormFieldGroup[],
  fieldGroup: string | string[] | undefined,
  selectedGroup: FormFieldGroup | undefined,
) {
  if (!selectedGroup) {
    return false
  }

  if (selectedGroup.name === ALL_FIELDS_GROUP.name) {
    return true
  }

  // "all fields" is not the selected group and the field has no group config, so it should be hidden
  if (fieldGroup === undefined) {
    return false
  }

  // if there's no group config for the object type, all fields are visible
  if (groupsConfig.length === 0 && selectedGroup.name === ALL_FIELDS_GROUP.name) {
    return true
  }

  return castArray(fieldGroup).includes(selectedGroup.name)
}

function isAcceptedObjectValue(value: any): value is Record<string, unknown> | undefined {
  return typeof value === 'undefined' || isRecord(value)
}

function isValidArrayOfObjectsValue(value: any): value is unknown[] | undefined {
  return typeof value === 'undefined' || Array.isArray(value)
}

function isValidArrayOfPrimitivesValue(
  value: any,
): value is (boolean | number | string)[] | undefined {
  return typeof value === 'undefined' || Array.isArray(value)
}

function everyItemIsObject(value: unknown[]): value is object[] {
  return value.length === 0 || value.every((item) => isRecord(item))
}

function findDuplicateKeyEntries(array: {_key: string}[]) {
  const seenKeys = new Set<string>()
  return array.reduce((acc: [index: number, key: string][], item, index) => {
    if (seenKeys.has(item._key)) {
      acc.push([index, item._key])
    }
    seenKeys.add(item._key)
    return acc
  }, [])
}

function hasKey<T extends object>(value: T): value is T & {_key: string} {
  return '_key' in value
}

function everyItemHasKey<T extends object>(array: T[]): array is (T & {_key: string})[] {
  return array?.every((item) => isRecord(item) && hasKey(item))
}

function isChangedValue(value: any, comparisonValue: any) {
  // changes panel is not being able to identify changes in array of objects
  // (especially when it comes to unpublished changes)
  // the main issue it fixes is in instances where the array removes a last item but instead of turning
  // "undefined" it returns an empty array (and so the change indicator remains active when it shouldn't)
  if (
    (Array.isArray(value) && typeof comparisonValue === 'undefined') ||
    (Array.isArray(comparisonValue) && typeof value === 'undefined')
  ) {
    return false
  }

  if (value && !comparisonValue) {
    return true
  }
  return !_isEqual(value, comparisonValue)
}

export interface CreatePrepareFormStateOptions {
  decorators?: {
    prepareFieldMember?: FunctionDecorator<PrepareFieldMember>
    prepareObjectInputState?: FunctionDecorator<PrepareObjectInputState>
    prepareArrayOfPrimitivesInputState?: FunctionDecorator<PrepareArrayOfPrimitivesInputState>
    prepareArrayOfObjectsInputState?: FunctionDecorator<PrepareArrayOfObjectsInputState>
    prepareArrayOfObjectsMember?: FunctionDecorator<PrepareArrayOfObjectsMember>
    prepareArrayOfPrimitivesMember?: FunctionDecorator<PrepareArrayOfPrimitivesMember>
    preparePrimitiveInputState?: FunctionDecorator<PreparePrimitiveInputState>
  }
}

export interface RootFormStateOptions {
  schemaType: ObjectSchemaType
  documentValue: unknown
  comparisonValue: unknown
  currentUser: Omit<CurrentUser, 'role'> | null
  hidden: boolean | StateTree<boolean> | undefined
  readOnly: boolean | StateTree<boolean> | undefined
  openPath: Path
  focusPath: Path
  presence: FormNodePresence[]
  validation: ValidationMarker[]
  fieldGroupState: StateTree<string> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  collapsedFieldSets: StateTree<boolean> | undefined
  changesOpen?: boolean
}

export interface PrepareFormState {
  (options: RootFormStateOptions): ObjectFormNode | null

  /** @internal */
  _prepareFieldMember: PrepareFieldMember
  /** @internal */
  _prepareObjectInputState: PrepareObjectInputState
  /** @internal */
  _prepareArrayOfPrimitivesInputState: PrepareArrayOfPrimitivesInputState
  /** @internal */
  _prepareArrayOfObjectsInputState: PrepareArrayOfObjectsInputState
  /** @internal */
  _prepareArrayOfObjectsMember: PrepareArrayOfObjectsMember
  /** @internal */
  _prepareArrayOfPrimitivesMember: PrepareArrayOfPrimitivesMember
  /** @internal */
  _preparePrimitiveInputState: PreparePrimitiveInputState
}

export function createPrepareFormState({
  decorators = {},
}: CreatePrepareFormStateOptions = {}): PrepareFormState {
  const memoizePrepareFieldMember = createMemoizer<PrepareFieldMember>({
    decorator: decorators.prepareFieldMember,
    getPath: ({parent, field}) => [...parent.path, field.name],
    hashInput: ({parent, field}) => {
      const path = [...parent.path, field.name]
      return {
        changesOpen: parent.changesOpen,
        presence: parent.presence.filter((p) => startsWith(path, p.path)),
        validation: parent.validation.filter((v) => startsWith(path, v.path)),
        focusPath: startsWith(path, parent.focusPath) ? parent.focusPath : [],
        openPath: startsWith(path, parent.openPath) ? parent.openPath : [],
        value: getId((parent.value as any)?.[field.name]),
        comparisonValue: getId((parent.comparisonValue as any)?.[field.name]),
        collapsedFieldSets: getId(parent.collapsedFieldSets?.children?.[field.name]),
        collapsedPaths: getId(parent.collapsedPaths?.children?.[field.name]),
        currentUser: getId(parent.currentUser),
        fieldGroupState: getId(parent.fieldGroupState),
        hidden:
          parent.hidden === true ||
          parent.hidden?.value ||
          getId(parent.hidden?.children?.[field.name]),
        readOnly:
          parent.readOnly === true ||
          parent.readOnly?.value ||
          getId(parent.readOnly?.children?.[field.name]),
        schemaType: getId(parent.schemaType),
      }
    },
  })

  const memoizePrepareObjectInputState = createMemoizer<PrepareObjectInputState>({
    decorator: decorators.prepareObjectInputState,
    getPath: ({path}) => path,
    hashInput: (state) => ({
      changesOpen: state.changesOpen,
      presence: state.presence.filter((p) => startsWith(state.path, p.path)),
      validation: state.validation.filter((v) => startsWith(state.path, v.path)),
      focusPath: startsWith(state.path, state.focusPath) ? state.focusPath : [],
      openPath: startsWith(state.path, state.openPath) ? state.openPath : [],
      value: getId(state.value),
      comparisonValue: getId(state.comparisonValue),
      collapsedFieldSets: getId(state.collapsedFieldSets),
      collapsedPaths: state.collapsedPaths,
      currentUser: getId(state.currentUser),
      fieldGroupState: getId(state.fieldGroupState),
      hidden: state.hidden === true || state.hidden?.value || getId(state.hidden),
      readOnly: state.readOnly === true || state.readOnly?.value || getId(state.readOnly),
      schemaType: getId(state.schemaType),
    }),
  })

  const memoizePrepareArrayOfPrimitivesInputState =
    createMemoizer<PrepareArrayOfPrimitivesInputState>({
      decorator: decorators.prepareArrayOfPrimitivesInputState,
      getPath: ({path}) => path,
      hashInput: (state) => ({
        changesOpen: state.changesOpen,
        presence: state.presence.filter((p) => startsWith(state.path, p.path)),
        validation: state.validation.filter((v) => startsWith(state.path, v.path)),
        focusPath: startsWith(state.path, state.focusPath) ? state.focusPath : [],
        openPath: startsWith(state.path, state.openPath) ? state.openPath : [],
        value: getId(state.value),
        comparisonValue: getId(state.comparisonValue),
        collapsedFieldSets: getId(state.collapsedFieldSets),
        collapsedPaths: state.collapsedPaths,
        currentUser: getId(state.currentUser),
        fieldGroupState: getId(state.fieldGroupState),
        hidden: state.hidden === true || state.hidden?.value || getId(state.hidden),
        readOnly: state.readOnly === true || state.readOnly?.value || getId(state.readOnly),
        schemaType: getId(state.schemaType),
      }),
    })

  const memoizePrepareArrayOfObjectsInputState = createMemoizer<PrepareArrayOfObjectsInputState>({
    decorator: decorators.prepareArrayOfObjectsInputState,
    getPath: ({path}) => path,
    hashInput: (state) => ({
      changesOpen: state.changesOpen,
      presence: state.presence.filter((p) => startsWith(state.path, p.path)),
      validation: state.validation.filter((v) => startsWith(state.path, v.path)),
      focusPath: startsWith(state.path, state.focusPath) ? state.focusPath : [],
      openPath: startsWith(state.path, state.openPath) ? state.openPath : [],
      value: getId(state.value),
      comparisonValue: getId(state.comparisonValue),
      collapsedFieldSets: getId(state.collapsedFieldSets),
      collapsedPaths: state.collapsedPaths,
      currentUser: getId(state.currentUser),
      fieldGroupState: getId(state.fieldGroupState),
      hidden: state.hidden === true || state.hidden?.value || getId(state.hidden),
      readOnly: state.readOnly === true || state.readOnly?.value || getId(state.readOnly),
      schemaType: getId(state.schemaType),
    }),
  })

  const memoizePrepareArrayOfObjectsMember = createMemoizer<PrepareArrayOfObjectsMember>({
    decorator: decorators.prepareArrayOfObjectsMember,
    getPath: ({parent, arrayItem}) => [...parent.path, {_key: arrayItem._key}],
    hashInput: ({parent, arrayItem}) => {
      const comparisonValue = Array.isArray(parent.comparisonValue)
        ? parent.comparisonValue.find((item) => isKeyedObject(item) && item._key === arrayItem._key)
        : undefined

      const key = arrayItem._key
      const path: Path = [...parent.path, {_key: key}]

      return {
        changesOpen: parent.changesOpen,
        presence: parent.presence.filter((p) => startsWith(path, p.path)),
        validation: parent.validation.filter((v) => startsWith(path, v.path)),
        focusPath: startsWith(path, parent.focusPath) ? parent.focusPath : [],
        openPath: startsWith(path, parent.openPath) ? parent.openPath : [],
        value: getId(arrayItem),
        comparisonValue: getId(comparisonValue),
        collapsedFieldSets: getId(parent.collapsedFieldSets?.children?.[key]),
        collapsedPaths: getId(parent.collapsedPaths?.children?.[key]),
        currentUser: getId(parent.currentUser),
        fieldGroupState: getId(parent.fieldGroupState?.children?.[key]),
        hidden:
          parent.hidden === true || parent.hidden?.value || getId(parent.hidden?.children?.[key]),
        readOnly:
          parent.readOnly === true ||
          parent.readOnly?.value ||
          getId(parent.readOnly?.children?.[key]),
        schemaType: getId(parent.schemaType),
      }
    },
  })

  const memoizePrepareArrayOfPrimitivesMember = createMemoizer<PrepareArrayOfPrimitivesMember>({
    decorator: decorators.prepareArrayOfPrimitivesMember,
    getPath: ({parent, index}) => [...parent.path, index],
    hashInput: ({parent, index, arrayItem}) => {
      const comparisonValue = Array.isArray(parent.comparisonValue)
        ? parent.comparisonValue[index]
        : undefined

      const path: Path = [...parent.path, index]

      return {
        changesOpen: parent.changesOpen,
        presence: parent.presence.filter((p) => startsWith(path, p.path)),
        validation: parent.validation.filter((v) => startsWith(path, v.path)),
        focusPath: startsWith(path, parent.focusPath) ? parent.focusPath : [],
        openPath: startsWith(path, parent.openPath) ? parent.openPath : [],
        collapsedFieldSets: getId(parent.collapsedFieldSets?.children?.[index]),
        collapsedPaths: getId(parent.collapsedPaths?.children?.[index]),
        currentUser: getId(parent.currentUser),
        fieldGroupState: getId(parent.fieldGroupState?.children?.[index]),
        hidden:
          parent.hidden === true || parent.hidden?.value || getId(parent.hidden?.children?.[index]),
        readOnly:
          parent.readOnly === true ||
          parent.readOnly?.value ||
          getId(parent.readOnly?.children?.[index]),
        schemaType: getId(parent.schemaType),
        value: `${arrayItem}`,
        comparisonValue: `${comparisonValue}`,
      }
    },
  })

  const memoizePreparePrimitiveInputState = createMemoizer<PreparePrimitiveInputState>({
    decorator: decorators.preparePrimitiveInputState,
    getPath: ({path}) => path,
    hashInput: (state) => ({
      changesOpen: state.changesOpen,
      presence: state.presence.filter((p) => startsWith(state.path, p.path)),
      validation: state.validation.filter((v) => startsWith(state.path, v.path)),
      focusPath: startsWith(state.path, state.focusPath) ? state.focusPath : [],
      openPath: startsWith(state.path, state.openPath) ? state.openPath : [],
      value: getId(state.value),
      comparisonValue: getId(state.comparisonValue),
      collapsedFieldSets: getId(state.collapsedFieldSets),
      collapsedPaths: state.collapsedPaths,
      currentUser: getId(state.currentUser),
      fieldGroupState: getId(state.fieldGroupState),
      hidden: state.hidden === true || state.hidden?.value || getId(state.hidden),
      readOnly: state.readOnly === true || state.readOnly?.value || getId(state.readOnly),
      schemaType: getId(state.schemaType),
    }),
  })

  /*
   * Takes a field in context of a parent object and returns prepared props for it
   */
  const prepareFieldMember = memoizePrepareFieldMember(function _prepareFieldMember(props) {
    const {field, index, parent} = props
    const fieldPath = pathFor([...parent.path, field.name])
    const fieldLevel = getFieldLevel(field.type, parent.level + 1)

    const parentValue = parent.value
    const parentComparisonValue = parent.comparisonValue
    if (!isAcceptedObjectValue(parentValue)) {
      // Note: we validate each field, before passing it recursively to this function so getting this error means that the
      // ´prepareFormState´ function itself has been called with a non-object value
      throw new Error('Unexpected non-object value')
    }

    const normalizedFieldGroupNames = field.group ? castArray(field.group) : []
    const inSelectedGroup = isFieldEnabledByGroupFilter(
      parent.groups,
      field.group,
      parent.selectedGroup,
    )

    if (isObjectSchemaType(field.type)) {
      const fieldValue = parentValue?.[field.name]
      const fieldComparisonValue = isRecord(parentComparisonValue)
        ? parentComparisonValue?.[field.name]
        : undefined

      if (!isAcceptedObjectValue(fieldValue)) {
        return {
          kind: 'error',
          key: field.name,
          fieldName: field.name,
          error: {
            type: 'INCOMPATIBLE_TYPE',
            expectedSchemaType: field.type,
            resolvedValueType: resolveTypeName(fieldValue),
            value: fieldValue,
          },
        }
      }

      const hidden =
        parent.hidden === true ||
        parent?.hidden?.value ||
        parent.hidden?.children?.[field.name]?.value

      if (hidden) {
        return {
          kind: 'hidden',
          key: `field-${field.name}`,
          name: field.name,
          index: index,
        }
      }

      // todo: consider requiring a _type annotation for object values on fields as well
      // if (resolvedValueType !== field.type.name) {
      //   return {
      //     kind: 'error',
      //     key: field.name,
      //     error: {
      //       type: 'TYPE_ANNOTATION_MISMATCH',
      //       expectedSchemaType: field.type,
      //       resolvedValueType,
      //     },
      //   }
      // }

      const fieldGroupState = parent.fieldGroupState?.children?.[field.name]
      const scopedCollapsedPaths = parent.collapsedPaths?.children?.[field.name]
      const scopedCollapsedFieldsets = parent.collapsedFieldSets?.children?.[field.name]
      const scopedHidden =
        parent.hidden === true || parent.hidden?.value || parent.hidden?.children?.[field.name]
      const scopedReadOnly =
        parent.readOnly === true ||
        parent.readOnly?.value ||
        parent.readOnly?.children?.[field.name]

      const inputState = prepareObjectInputState({
        schemaType: field.type,
        currentUser: parent.currentUser,
        value: fieldValue,
        changed: isChangedValue(fieldValue, fieldComparisonValue),
        comparisonValue: fieldComparisonValue,
        presence: parent.presence,
        validation: parent.validation,
        fieldGroupState,
        path: fieldPath,
        level: fieldLevel,
        focusPath: parent.focusPath,
        openPath: parent.openPath,
        collapsedPaths: scopedCollapsedPaths,
        collapsedFieldSets: scopedCollapsedFieldsets,
        hidden: scopedHidden,
        readOnly: scopedReadOnly,
        changesOpen: parent.changesOpen,
      })

      if (inputState === null) {
        // if inputState is null is either because we reached max field depth or if it has no visible members
        return null
      }

      const defaultCollapsedState = getCollapsedWithDefaults(field.type.options, fieldLevel)
      const collapsed = scopedCollapsedPaths
        ? scopedCollapsedPaths.value
        : defaultCollapsedState.collapsed

      return {
        kind: 'field',
        key: `field-${field.name}`,
        name: field.name,
        index: index,

        inSelectedGroup,
        groups: normalizedFieldGroupNames,

        open: startsWith(fieldPath, parent.openPath),
        field: inputState,
        collapsed,
        collapsible: defaultCollapsedState.collapsible,
      }
    } else if (isArraySchemaType(field.type)) {
      const fieldValue = parentValue?.[field.name] as unknown[] | undefined
      const fieldComparisonValue = isRecord(parentComparisonValue)
        ? parentComparisonValue?.[field.name]
        : undefined
      if (isArrayOfObjectsSchemaType(field.type)) {
        const hasValue = typeof fieldValue !== 'undefined'
        if (hasValue && !isValidArrayOfObjectsValue(fieldValue)) {
          const resolvedValueType = resolveTypeName(fieldValue)

          return {
            kind: 'error',
            key: field.name,
            fieldName: field.name,
            error: {
              type: 'INCOMPATIBLE_TYPE',
              expectedSchemaType: field.type,
              resolvedValueType,
              value: fieldValue,
            },
          }
        }

        if (hasValue && !everyItemIsObject(fieldValue)) {
          return {
            kind: 'error',
            key: field.name,
            fieldName: field.name,
            error: {
              type: 'MIXED_ARRAY',
              schemaType: field.type,
              value: fieldValue,
            },
          }
        }

        if (hasValue && !everyItemHasKey(fieldValue)) {
          return {
            kind: 'error',
            key: field.name,
            fieldName: field.name,
            error: {
              type: 'MISSING_KEYS',
              value: fieldValue,
              schemaType: field.type,
            },
          }
        }

        const duplicateKeyEntries = hasValue ? findDuplicateKeyEntries(fieldValue) : []
        if (duplicateKeyEntries.length > 0) {
          return {
            kind: 'error',
            key: field.name,
            fieldName: field.name,
            error: {
              type: 'DUPLICATE_KEYS',
              duplicates: duplicateKeyEntries,
              schemaType: field.type,
            },
          }
        }

        const fieldGroupState = parent.fieldGroupState?.children?.[field.name]
        const scopedCollapsedPaths = parent.collapsedPaths?.children?.[field.name]
        const scopedCollapsedFieldSets = parent.collapsedFieldSets?.children?.[field.name]
        const scopedHidden =
          parent.hidden === true || parent.hidden?.value || parent.hidden?.children?.[field.name]
        const scopedReadOnly =
          parent.readOnly === true ||
          parent.readOnly?.value ||
          parent.readOnly?.children?.[field.name]

        const fieldState = prepareArrayOfObjectsInputState({
          schemaType: field.type,
          currentUser: parent.currentUser,
          value: fieldValue,
          changed: isChangedValue(fieldValue, fieldComparisonValue),
          comparisonValue: fieldComparisonValue as FIXME,
          fieldGroupState,
          focusPath: parent.focusPath,
          openPath: parent.openPath,
          presence: parent.presence,
          validation: parent.validation,
          collapsedPaths: scopedCollapsedPaths,
          collapsedFieldSets: scopedCollapsedFieldSets,
          level: fieldLevel,
          path: fieldPath,
          readOnly: scopedReadOnly,
          hidden: scopedHidden,
          changesOpen: parent.changesOpen,
        })

        if (fieldState === null) {
          return null
        }

        return {
          kind: 'field',
          key: `field-${field.name}`,
          name: field.name,
          index: index,

          open: startsWith(fieldPath, parent.openPath),

          inSelectedGroup,
          groups: normalizedFieldGroupNames,

          collapsible: false,
          collapsed: false,
          // note: this is what we actually end up passing down as to the next input component
          field: fieldState,
        }
      } else {
        // array of primitives
        if (!isValidArrayOfPrimitivesValue(fieldValue)) {
          const resolvedValueType = resolveTypeName(fieldValue)

          return {
            kind: 'error',
            key: field.name,
            fieldName: field.name,
            error: {
              type: 'INCOMPATIBLE_TYPE',
              expectedSchemaType: field.type,
              resolvedValueType,
              value: fieldValue,
            },
          }
        }

        const fieldGroupState = parent.fieldGroupState?.children?.[field.name]
        const scopedCollapsedPaths = parent.collapsedPaths?.children?.[field.name]
        const scopedCollapsedFieldSets = parent.collapsedFieldSets?.children?.[field.name]
        const scopedHidden =
          parent.hidden === true || parent.hidden?.value || parent.hidden?.children?.[field.name]
        const scopedReadOnly =
          parent.readOnly === true ||
          parent.readOnly?.value ||
          parent.readOnly?.children?.[field.name]

        const fieldState = prepareArrayOfPrimitivesInputState({
          changed: isChangedValue(fieldValue, fieldComparisonValue),
          comparisonValue: fieldComparisonValue as FIXME,
          schemaType: field.type,
          currentUser: parent.currentUser,
          value: fieldValue,
          fieldGroupState,
          focusPath: parent.focusPath,
          openPath: parent.openPath,
          presence: parent.presence,
          validation: parent.validation,
          collapsedPaths: scopedCollapsedPaths,
          collapsedFieldSets: scopedCollapsedFieldSets,
          level: fieldLevel,
          path: fieldPath,
          readOnly: scopedReadOnly,
          hidden: scopedHidden,
          changesOpen: parent.changesOpen,
        })

        if (fieldState === null) {
          return null
        }

        return {
          kind: 'field',
          key: `field-${field.name}`,
          name: field.name,
          index: index,

          inSelectedGroup,
          groups: normalizedFieldGroupNames,

          open: startsWith(fieldPath, parent.openPath),

          // todo: consider support for collapsible arrays
          collapsible: false,
          collapsed: false,
          // note: this is what we actually end up passing down as to the next input component
          field: fieldState,
        }
      }
    } else {
      // primitive fields

      const fieldValue = parentValue?.[field.name] as undefined | boolean | string | number
      const fieldComparisonValue = isRecord(parentComparisonValue)
        ? parentComparisonValue?.[field.name]
        : undefined

      // note: we *only* want to call the conditional props here, as it's handled by the prepare<Object|Array>InputProps otherwise
      const hidden =
        parent.hidden === true ||
        parent.hidden?.value ||
        parent.hidden?.children?.[field.name]?.value

      if (hidden) {
        return null
      }

      const scopedHidden =
        parent.hidden === true || parent.hidden?.value || parent.hidden?.children?.[field.name]
      const scopedReadOnly =
        parent.readOnly === true ||
        parent.readOnly?.value ||
        parent.readOnly?.children?.[field.name]

      const fieldState = preparePrimitiveInputState({
        ...parent,
        comparisonValue: fieldComparisonValue,
        value: fieldValue as boolean | string | number | undefined,
        schemaType: field.type as PrimitiveSchemaType,
        path: fieldPath,
        readOnly: scopedReadOnly,
        hidden: scopedHidden,
      })

      return {
        kind: 'field',
        key: `field-${field.name}`,
        name: field.name,
        index: index,
        open: startsWith(fieldPath, parent.openPath),

        inSelectedGroup,
        groups: normalizedFieldGroupNames,

        // todo: consider support for collapsible primitive fields
        collapsible: false,
        collapsed: false,
        field: fieldState,
      }
    }
  })

  const prepareObjectInputState = memoizePrepareObjectInputState(function _prepareObjectInputState(
    props,
    enableHiddenCheck = true,
  ) {
    if (props.level === MAX_FIELD_DEPTH) {
      return null
    }

    const readOnly = props.readOnly === true || props.readOnly?.value

    const schemaTypeGroupConfig = props.schemaType.groups || []
    const defaultGroupName = (schemaTypeGroupConfig.find((g) => g.default) || ALL_FIELDS_GROUP)
      ?.name

    const groups = [ALL_FIELDS_GROUP, ...schemaTypeGroupConfig].flatMap(
      (group): FormFieldGroup[] => {
        const groupHidden =
          props.hidden === true ||
          props.hidden?.value ||
          props.hidden?.children?.[`group:${group.name}`]?.value
        const isSelected = group.name === (props.fieldGroupState?.value || defaultGroupName)

        // Set the "all-fields" group as selected when review changes is open to enable review of all
        // fields and changes together. When review changes is closed - switch back to the selected tab.
        const selected = props.changesOpen ? group.name === ALL_FIELDS_GROUP.name : isSelected
        // Also disable non-selected groups when review changes is open
        const disabled = props.changesOpen ? !selected : false

        return groupHidden
          ? []
          : [
              {
                disabled,
                icon: group?.icon,
                name: group.name,
                selected,
                title: group.title,
                i18n: group.i18n,
              },
            ]
      },
    )

    const selectedGroup = groups.find((group) => group.selected)

    // note: this is needed because not all object types gets a ´fieldsets´ property during schema parsing.
    // ideally members should be normalized as part of the schema parsing and not here
    const normalizedSchemaMembers: typeof props.schemaType.fieldsets = props.schemaType.fieldsets
      ? props.schemaType.fieldsets
      : props.schemaType.fields.map((field) => ({single: true, field}))

    // create a members array for the object
    const members = normalizedSchemaMembers.flatMap(
      (fieldSet, index): (ObjectMember | HiddenField)[] => {
        // "single" means not part of a fieldset
        if (fieldSet.single) {
          const field = fieldSet.field

          const fieldMember = prepareFieldMember({
            field: field,
            parent: {...props, groups, selectedGroup},
            index,
          })

          return fieldMember ? [fieldMember] : []
        }

        // it's an actual fieldset
        const fieldsetHidden =
          props.hidden === true ||
          props.hidden?.value ||
          props.hidden?.children?.[`fieldset:${fieldSet.name}`]?.value

        const fieldsetMembers = fieldSet.fields.flatMap(
          (field): (FieldMember | FieldError | HiddenField)[] => {
            if (fieldsetHidden) {
              return [
                {
                  kind: 'hidden',
                  key: `field-${field.name}`,
                  name: field.name,
                  index: index,
                },
              ]
            }
            const fieldMember = prepareFieldMember({
              field: field,
              parent: {...props, groups, selectedGroup},
              index,
            }) as FieldMember | FieldError | HiddenField

            return fieldMember ? [fieldMember] : []
          },
        )

        const defaultCollapsedState = getCollapsedWithDefaults(fieldSet.options, props.level)

        const collapsed =
          (props.collapsedFieldSets?.children || {})[fieldSet.name]?.value ??
          defaultCollapsedState.collapsed

        return [
          {
            kind: 'fieldSet',
            key: `fieldset-${fieldSet.name}`,
            _inSelectedGroup: isFieldEnabledByGroupFilter(groups, fieldSet.group, selectedGroup),
            groups: fieldSet.group ? castArray(fieldSet.group) : [],
            fieldSet: {
              path: pathFor(props.path.concat(fieldSet.name)),
              name: fieldSet.name,
              title: fieldSet.title,
              description: fieldSet.description,
              hidden: false,
              level: props.level + 1,
              members: fieldsetMembers.filter(
                (member): member is FieldMember => member.kind !== 'hidden',
              ),
              collapsible: defaultCollapsedState?.collapsible,
              collapsed,
              columns: fieldSet?.options?.columns,
            },
          },
        ]
      },
    )

    const hasFieldGroups = schemaTypeGroupConfig.length > 0

    const filteredPresence = props.presence.filter((item) => isEqual(item.path, props.path))
    const presence = filteredPresence.length ? filteredPresence : EMPTY_ARRAY

    const validation = props.validation
      .filter((item) => isEqual(item.path, props.path))
      .map((v) => ({level: v.level, message: v.message, path: v.path}))

    const visibleMembers = members.filter(
      (member): member is ObjectMember => member.kind !== 'hidden',
    )

    // Return null here only when enableHiddenCheck, or we end up with array members that have 'item: null' when they
    // really should not be. One example is when a block object inside the PT-input have a type with one single hidden field.
    // Then it should still be possible to see the member item, even though all of it's fields are null.
    if (visibleMembers.length === 0 && enableHiddenCheck) {
      return null
    }

    const visibleGroups = hasFieldGroups
      ? groups.flatMap((group) => {
          // The "all fields" group is always visible
          if (group.name === ALL_FIELDS_GROUP.name) {
            return group
          }
          const hasVisibleMembers = visibleMembers.some((member) => {
            if (member.kind === 'error') {
              return false
            }
            if (member.kind === 'field') {
              return member.groups.includes(group.name)
            }

            return (
              member.groups.includes(group.name) ||
              member.fieldSet.members.some(
                (fieldsetMember) =>
                  fieldsetMember.kind !== 'error' && fieldsetMember.groups.includes(group.name),
              )
            )
          })
          return hasVisibleMembers ? group : []
        })
      : []

    const filtereredMembers = visibleMembers.flatMap(
      (member): (FieldError | FieldMember | FieldSetMember)[] => {
        if (member.kind === 'error') {
          return [member]
        }
        if (member.kind === 'field') {
          return member.inSelectedGroup ? [member] : []
        }

        const filteredFieldsetMembers: ObjectMember[] = member.fieldSet.members.filter(
          (fieldsetMember) => fieldsetMember.kind !== 'field' || fieldsetMember.inSelectedGroup,
        )
        return filteredFieldsetMembers.length > 0
          ? [
              {
                ...member,
                fieldSet: {...member.fieldSet, members: filteredFieldsetMembers},
              } as FieldSetMember,
            ]
          : []
      },
    )

    const node = {
      value: props.value as Record<string, unknown> | undefined,
      changed: isChangedValue(props.value, props.comparisonValue),
      schemaType: props.schemaType,
      readOnly,
      path: props.path,
      id: toString(props.path),
      level: props.level,
      focused: isEqual(props.path, props.focusPath),
      focusPath: trimChildPath(props.path, props.focusPath),
      presence,
      validation,
      // this is currently needed by getExpandOperations which needs to know about hidden members
      // (e.g. members not matching current group filter) in order to determine what to expand
      members: filtereredMembers,
      groups: visibleGroups,
    }
    Object.defineProperty(node, '_allMembers', {
      value: members,
      enumerable: false,
    })
    return node
  })

  const prepareArrayOfPrimitivesInputState = memoizePrepareArrayOfPrimitivesInputState(
    function _prepareArrayOfPrimitivesInputState(props) {
      if (props.level === MAX_FIELD_DEPTH) {
        return null
      }

      if (props.hidden === true || props.hidden?.value) {
        return null
      }

      // Todo: improve error handling at the parent level so that the value here is either undefined or an array
      const items = Array.isArray(props.value) ? props.value : []

      const filteredPresence = props.presence.filter((item) => isEqual(item.path, props.path))
      const presence = filteredPresence.length ? filteredPresence : EMPTY_ARRAY
      const validation = props.validation
        .filter((item) => isEqual(item.path, props.path))
        .map((v) => ({level: v.level, message: v.message, path: v.path}))
      const members = items.flatMap((item, index) =>
        prepareArrayOfPrimitivesMember({arrayItem: item, parent: props, index}),
      )
      return {
        // checks for changes not only on the array itself, but also on any of its items
        changed: props.changed || members.some((m) => m.kind === 'item' && m.item.changed),
        value: props.value,
        readOnly: props.readOnly === true || props.readOnly?.value,
        schemaType: props.schemaType,
        focused: isEqual(props.path, props.focusPath),
        focusPath: trimChildPath(props.path, props.focusPath),
        path: props.path,
        id: toString(props.path),
        level: props.level,
        validation,
        presence,
        members,
      }
    },
  )

  const prepareArrayOfObjectsInputState = memoizePrepareArrayOfObjectsInputState(
    function _prepareArrayOfObjectsInputState(props) {
      if (props.level === MAX_FIELD_DEPTH) {
        return null
      }

      if (props.hidden === true || props.hidden?.value) {
        return null
      }

      // Todo: improve error handling at the parent level so that the value here is either undefined or an array
      const items = Array.isArray(props.value) ? props.value : []

      const filteredPresence = props.presence.filter((item) => isEqual(item.path, props.path))
      const presence = filteredPresence.length ? filteredPresence : EMPTY_ARRAY
      const validation = props.validation
        .filter((item) => isEqual(item.path, props.path))
        .map((v) => ({level: v.level, message: v.message, path: v.path}))

      const members = items.flatMap((item, index) =>
        prepareArrayOfObjectsMember({
          arrayItem: item,
          parent: props,
          index,
        }),
      )

      return {
        // checks for changes not only on the array itself, but also on any of its items
        changed: props.changed || members.some((m) => m.kind === 'item' && m.item.changed),
        value: props.value,
        readOnly: props.readOnly === true || props.readOnly?.value,
        schemaType: props.schemaType,
        focused: isEqual(props.path, props.focusPath),
        focusPath: trimChildPath(props.path, props.focusPath),
        path: props.path,
        id: toString(props.path),
        level: props.level,
        validation,
        presence,
        members,
      }
    },
  )

  /*
   * Takes a field in context of a parent object and returns prepared props for it
   */
  const prepareArrayOfObjectsMember = memoizePrepareArrayOfObjectsMember(
    function _prepareArrayOfObjectsMember(props) {
      const {arrayItem, parent, index} = props

      const itemType = getItemType(parent.schemaType, arrayItem) as ObjectSchemaType

      const key = arrayItem._key

      if (!itemType) {
        const itemTypeName = resolveTypeName(arrayItem)
        return {
          kind: 'error',
          key,
          index,
          error: {
            type: 'INVALID_ITEM_TYPE',
            resolvedValueType: itemTypeName,
            value: arrayItem,
            validTypes: parent.schemaType.of,
          },
        }
      }

      const itemPath = pathFor([...parent.path, {_key: key}])
      const itemLevel = parent.level + 1

      const fieldGroupState = parent.fieldGroupState?.children?.[key]
      const scopedCollapsedPaths = parent.collapsedPaths?.children?.[key]
      const scopedCollapsedFieldsets = parent.collapsedFieldSets?.children?.[key]

      const scopedHidden =
        parent.hidden === true || parent.hidden?.value || parent.hidden?.children?.[key]
      const scopedReadOnly =
        parent.readOnly === true || parent.readOnly?.value || parent.readOnly?.children?.[key]

      const comparisonValue =
        (Array.isArray(parent.comparisonValue) &&
          parent.comparisonValue.find((i) => i._key === arrayItem._key)) ||
        undefined

      const itemState = prepareObjectInputState(
        {
          schemaType: itemType,
          level: itemLevel,
          value: arrayItem,
          comparisonValue,
          changed: isChangedValue(arrayItem, comparisonValue),
          path: itemPath,
          focusPath: parent.focusPath,
          openPath: parent.openPath,
          currentUser: parent.currentUser,
          collapsedPaths: scopedCollapsedPaths,
          collapsedFieldSets: scopedCollapsedFieldsets,
          presence: parent.presence,
          validation: parent.validation,
          fieldGroupState,
          readOnly: scopedReadOnly,
          hidden: scopedHidden,
        },
        false,
      ) as ObjectArrayFormNode

      const defaultCollapsedState = getCollapsedWithDefaults(itemType.options, itemLevel)
      const collapsed = scopedCollapsedPaths?.value ?? defaultCollapsedState.collapsed
      return {
        kind: 'item',
        key,
        index,
        open: startsWith(itemPath, parent.openPath),
        collapsed: collapsed,
        collapsible: true,
        parentSchemaType: parent.schemaType,
        item: itemState,
      }
    },
  )

  /*
   * Takes a field in contet of a parent object and returns prepared props for it
   */
  const prepareArrayOfPrimitivesMember = memoizePrepareArrayOfPrimitivesMember(
    function _prepareArrayOfPrimitivesMember(props) {
      const {arrayItem, parent, index} = props
      const itemType = getPrimitiveItemType(parent.schemaType, arrayItem)

      const itemPath = pathFor([...parent.path, index])
      const itemValue = (parent.value as unknown[] | undefined)?.[index] as
        | string
        | boolean
        | number
      const itemComparisonValue = (parent.comparisonValue as unknown[] | undefined)?.[index] as
        | string
        | boolean
        | number
      const itemLevel = parent.level + 1

      // Best effort attempt to make a stable key for each item in the array
      // Since items may be reordered and change at any time, there's no way to reliably address each item uniquely
      // This is a "best effort"-attempt at making sure we don't re-use internal state for item inputs
      // when items are added to or removed from the array
      const key = `${itemType?.name || 'invalid-type'}-${String(index)}`

      if (!itemType) {
        return {
          kind: 'error',
          key,
          index,
          error: {
            type: 'INVALID_ITEM_TYPE',
            validTypes: parent.schemaType.of,
            resolvedValueType: resolveTypeName(itemType),
            value: itemValue,
          },
        }
      }

      // const scopedHidden =
      //   parent.hidden === true || parent.hidden?.value || parent.hidden?.children?.[field.name]
      const scopedReadOnly =
        parent.readOnly === true || parent.readOnly?.value || parent.readOnly?.children?.[index]

      const item = preparePrimitiveInputState({
        ...parent,
        path: itemPath,
        schemaType: itemType as PrimitiveSchemaType,
        level: itemLevel,
        value: itemValue,
        comparisonValue: itemComparisonValue,
        readOnly: scopedReadOnly,
      })

      return {
        kind: 'item',
        key,
        index,
        parentSchemaType: parent.schemaType,
        open: isEqual(itemPath, parent.openPath),
        item,
      }
    },
  )

  const preparePrimitiveInputState = memoizePreparePrimitiveInputState(
    function _preparePrimitiveInputState(props) {
      const filteredPresence = props.presence.filter((item) => isEqual(item.path, props.path))
      const presence = filteredPresence.length ? filteredPresence : EMPTY_ARRAY

      const validation = props.validation
        .filter((item) => isEqual(item.path, props.path))
        .map((v) => ({level: v.level, message: v.message, path: v.path}))
      return {
        schemaType: props.schemaType,
        changed: isChangedValue(props.value, props.comparisonValue),
        value: props.value,
        level: props.level,
        id: toString(props.path),
        readOnly: props.readOnly === true || props.readOnly?.value,
        focused: isEqual(props.path, props.focusPath),
        path: props.path,
        presence,
        validation,
      } as PrimitiveFormNode
    },
  )

  function prepareFormState({
    collapsedFieldSets,
    collapsedPaths,
    comparisonValue,
    currentUser,
    documentValue,
    fieldGroupState,
    focusPath,
    hidden,
    openPath,
    presence,
    readOnly,
    schemaType,
    validation,
    changesOpen,
  }: RootFormStateOptions): ObjectFormNode | null {
    return prepareObjectInputState({
      collapsedFieldSets,
      collapsedPaths,
      comparisonValue,
      currentUser,
      value: documentValue,
      fieldGroupState,
      focusPath,
      hidden: hidden === false ? EMPTY_OBJECT : hidden,
      openPath,
      presence,
      readOnly: readOnly === false ? EMPTY_OBJECT : readOnly,
      schemaType,
      validation,
      changesOpen,
      level: 0,
      path: [],
    })
  }

  prepareFormState._prepareFieldMember = prepareFieldMember
  prepareFormState._prepareFieldMember = prepareFieldMember
  prepareFormState._prepareObjectInputState = prepareObjectInputState
  prepareFormState._prepareArrayOfPrimitivesInputState = prepareArrayOfPrimitivesInputState
  prepareFormState._prepareArrayOfObjectsInputState = prepareArrayOfObjectsInputState
  prepareFormState._prepareArrayOfObjectsMember = prepareArrayOfObjectsMember
  prepareFormState._prepareArrayOfPrimitivesMember = prepareArrayOfPrimitivesMember
  prepareFormState._preparePrimitiveInputState = preparePrimitiveInputState

  return prepareFormState
}
