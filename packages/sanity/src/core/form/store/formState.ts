/* eslint-disable max-statements */
/* eslint-disable camelcase, no-else-return */

import {
  ArraySchemaType,
  BooleanSchemaType,
  CurrentUser,
  isArrayOfObjectsSchemaType,
  isArraySchemaType,
  isObjectSchemaType,
  NumberSchemaType,
  ObjectField,
  ObjectSchemaType,
  Path,
  StringSchemaType,
  ValidationMarker,
} from '@sanity/types'

import {castArray, isEqual as _isEqual, pick} from 'lodash'
import {isEqual, pathFor, startsWith, toString, trimChildPath} from '@sanity/util/paths'
import {resolveTypeName} from '@sanity/util/content'

import {EMPTY_ARRAY, isNonNullable, isRecord} from '../../util'
import {getFieldLevel} from '../studio/inputResolver/helpers'
import {FIXME} from '../../FIXME'
import {FormNodePresence} from '../../presence'

import {
  FieldSetMember,
  HiddenField,
  ObjectArrayFormNode,
  PrimitiveFormNode,
  StateTree,
} from './types'
import {resolveConditionalProperty} from './conditional-property'
import {ALL_FIELDS_GROUP, MAX_FIELD_DEPTH} from './constants'
import {getItemType, getPrimitiveItemType} from './utils/getItemType'
import {
  ArrayOfObjectsMember,
  ArrayOfPrimitivesMember,
  FieldMember,
  ObjectMember,
} from './types/members'
import {ArrayOfObjectsFormNode, ArrayOfPrimitivesFormNode, ObjectFormNode} from './types/nodes'
import {FormFieldGroup} from './types/fieldGroup'
import {getCollapsedWithDefaults} from './utils/getCollapsibleOptions'
import {FieldError} from './types/memberErrors'

type PrimitiveSchemaType = BooleanSchemaType | NumberSchemaType | StringSchemaType

function isFieldEnabledByGroupFilter(
  // the groups config for the "enclosing object" type
  groupsConfig: FormFieldGroup[],
  fieldGroup: string | string[] | undefined,
  selectedGroup: FormFieldGroup
) {
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
  value: any
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
  if (value && !comparisonValue) {
    return true
  }
  return !_isEqual(value, comparisonValue)
}

/*
 * Takes a field in context of a parent object and returns prepared props for it
 */
function prepareFieldMember(props: {
  field: ObjectField
  parent: RawState<ObjectSchemaType, unknown> & {
    groups: FormFieldGroup[]
    selectedGroup: FormFieldGroup
  }
  index: number
}): ObjectMember | HiddenField | null {
  const {parent, field, index} = props
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
    parent.selectedGroup
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

    const conditionalPropertyContext = {
      value: fieldValue,
      parent: parent.value,
      document: parent.document,
      currentUser: parent.currentUser,
    }
    const hidden = resolveConditionalProperty(field.type.hidden, conditionalPropertyContext)

    if (hidden) {
      return {
        kind: 'hidden',
        key: `field-${field.name}`,
        name: field.name,
        index: index,
      }
    }

    // readonly is inherited
    const readOnly =
      parent.readOnly || resolveConditionalProperty(field.type.readOnly, conditionalPropertyContext)

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

    const inputState = prepareObjectInputState({
      schemaType: field.type,
      currentUser: parent.currentUser,
      parent: parent.value,
      document: parent.document,
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
      readOnly,
      changesOpen: parent.changesOpen,
    })

    if (inputState === null) {
      // if inputState is null is either because we reached max field depth or if it has no visible members
      return null
    }

    const defaultCollapsedState = getCollapsedWithDefaults(field.type.options as FIXME, fieldLevel)
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

      const readOnly =
        parent.readOnly ||
        resolveConditionalProperty(field.type.readOnly, {
          value: fieldValue,
          parent: parent.value,
          document: parent.document,
          currentUser: parent.currentUser,
        })

      const fieldState = prepareArrayOfObjectsInputState({
        schemaType: field.type,
        parent: parent.value,
        currentUser: parent.currentUser,
        document: parent.document,
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
        readOnly,
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

      const readOnly =
        parent.readOnly ||
        resolveConditionalProperty(field.type.readOnly, {
          value: fieldValue,
          parent: parent.value,
          document: parent.document,
          currentUser: parent.currentUser,
        })

      const fieldState = prepareArrayOfPrimitivesInputState({
        changed: isChangedValue(fieldValue, fieldComparisonValue),
        comparisonValue: fieldComparisonValue as FIXME,
        schemaType: field.type,
        parent: parent.value,
        currentUser: parent.currentUser,
        document: parent.document,
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
        readOnly,
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

    const conditionalPropertyContext = {
      value: fieldValue,
      parent: parent.value,
      document: parent.document,
      currentUser: parent.currentUser,
    }

    // note: we *only* want to call the conditional props here, as it's handled by the prepare<Object|Array>InputProps otherwise
    const hidden = resolveConditionalProperty(field.type.hidden, conditionalPropertyContext)

    if (hidden) {
      return null
    }

    const readOnly =
      parent.readOnly || resolveConditionalProperty(field.type.readOnly, conditionalPropertyContext)

    const fieldState = preparePrimitiveInputState({
      ...parent,
      comparisonValue: fieldComparisonValue,
      value: fieldValue as boolean | string | number | undefined,
      schemaType: field.type as PrimitiveSchemaType,
      path: fieldPath,
      readOnly,
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
}

interface RawState<SchemaType, T> {
  schemaType: SchemaType
  value?: T
  comparisonValue?: T | null
  changed?: boolean
  document: FIXME_SanityDocument
  currentUser: Omit<CurrentUser, 'role'> | null
  parent?: unknown
  hidden?: boolean
  readOnly?: boolean
  path: Path
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

function prepareObjectInputState<T>(
  props: RawState<ObjectSchemaType, T>,
  enableHiddenCheck?: false
): ObjectFormNode
function prepareObjectInputState<T>(
  props: RawState<ObjectSchemaType, T>,
  enableHiddenCheck?: true
): ObjectFormNode | null
function prepareObjectInputState<T>(
  props: RawState<ObjectSchemaType, T>,
  enableHiddenCheck = true
): ObjectFormNode | null {
  if (props.level === MAX_FIELD_DEPTH) {
    return null
  }

  const conditionalPropertyContext = {
    value: props.value,
    parent: props.parent,
    document: props.document,
    currentUser: props.currentUser,
  }

  // readonly is inherited
  const readOnly =
    props.readOnly ||
    resolveConditionalProperty(props.schemaType.readOnly, conditionalPropertyContext)

  const schemaTypeGroupConfig = props.schemaType.groups || []
  const defaultGroupName = (schemaTypeGroupConfig.find((g) => g.default) || ALL_FIELDS_GROUP)?.name

  const groups = [ALL_FIELDS_GROUP, ...schemaTypeGroupConfig].flatMap((group): FormFieldGroup[] => {
    const groupHidden = resolveConditionalProperty(group.hidden, conditionalPropertyContext)
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
          },
        ]
  })

  const selectedGroup = groups.find((group) => group.selected)!

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
          parent: {...props, readOnly, groups, selectedGroup},
          index,
        })

        return fieldMember ? [fieldMember] : []
      }

      // it's an actual fieldset
      const fieldsetFieldNames = fieldSet.fields.map((f) => f.name)
      const fieldsetHidden = resolveConditionalProperty(fieldSet.hidden, {
        currentUser: props.currentUser,
        document: props.document,
        parent: props.value,
        value: pick(props.value, fieldsetFieldNames),
      })

      const fieldsetReadOnly = resolveConditionalProperty(fieldSet.readOnly, {
        currentUser: props.currentUser,
        document: props.document,
        parent: props.value,
        value: pick(props.value, fieldsetFieldNames),
      })

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
            parent: {...props, readOnly: readOnly || fieldsetReadOnly, groups, selectedGroup},
            index,
          }) as FieldMember | FieldError | HiddenField

          return fieldMember ? [fieldMember] : []
        }
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
              (member): member is FieldMember => member.kind !== 'hidden'
            ),
            collapsible: defaultCollapsedState?.collapsible,
            collapsed,
            columns: fieldSet?.options?.columns,
          },
        },
      ]
    }
  )

  const hasFieldGroups = schemaTypeGroupConfig.length > 0

  const filteredPresence = props.presence.filter((item) => isEqual(item.path, props.path))
  const presence = filteredPresence.length ? filteredPresence : EMPTY_ARRAY

  const validation = props.validation
    .filter((item) => isEqual(item.path, props.path))
    .map((v) => ({level: v.level, message: v.item.message, path: v.path}))

  const visibleMembers = members.filter(
    (member): member is ObjectMember => member.kind !== 'hidden'
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
                fieldsetMember.kind !== 'error' && fieldsetMember.groups.includes(group.name)
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
        (fieldsetMember) => fieldsetMember.kind !== 'field' || fieldsetMember.inSelectedGroup
      )
      return filteredFieldsetMembers.length > 0
        ? [
            {
              ...member,
              fieldSet: {...member.fieldSet, members: filteredFieldsetMembers},
            } as FieldSetMember,
          ]
        : []
    }
  )

  return {
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
    _allMembers: members,
    members: filtereredMembers,
    groups: visibleGroups,
  }
}

function prepareArrayOfPrimitivesInputState<T extends (boolean | string | number)[]>(
  props: RawState<ArraySchemaType, T>
): ArrayOfPrimitivesFormNode | null {
  if (props.level === MAX_FIELD_DEPTH) {
    return null
  }

  const conditionalPropertyContext = {
    comparisonValue: props.comparisonValue,
    value: props.value,
    parent: props.parent,
    document: props.document,
    currentUser: props.currentUser,
  }

  const hidden = resolveConditionalProperty(props.schemaType.hidden, conditionalPropertyContext)

  if (hidden) {
    return null
  }

  const readOnly =
    props.readOnly ||
    resolveConditionalProperty(props.schemaType.readOnly, conditionalPropertyContext)

  // Todo: improve error handling at the parent level so that the value here is either undefined or an array
  const items = Array.isArray(props.value) ? props.value : []

  const filteredPresence = props.presence.filter((item) => isEqual(item.path, props.path))
  const presence = filteredPresence.length ? filteredPresence : EMPTY_ARRAY
  const validation = props.validation
    .filter((item) => isEqual(item.path, props.path))
    .map((v) => ({level: v.level, message: v.item.message, path: v.path}))
  const members = items.flatMap((item, index) =>
    prepareArrayOfPrimitivesMember({arrayItem: item, parent: props, index})
  )
  return {
    changed: members.some((m) => m.kind === 'item' && m.item.changed), // TODO: is this correct? There could be field and fieldsets here?
    value: props.value as T,
    readOnly,
    schemaType: props.schemaType,
    focused: isEqual(props.path, props.focusPath),
    focusPath: trimChildPath(props.path, props.focusPath),
    path: props.path.concat([0]),
    id: toString(props.path),
    level: props.level,
    validation,
    presence,
    members,
  }
}

function prepareArrayOfObjectsInputState<T extends {_key: string}[]>(
  props: RawState<ArraySchemaType, T>
): ArrayOfObjectsFormNode | null {
  if (props.level === MAX_FIELD_DEPTH) {
    return null
  }

  const conditionalPropertyContext = {
    value: props.value,
    parent: props.parent,
    document: props.document,
    currentUser: props.currentUser,
  }
  const hidden = resolveConditionalProperty(props.schemaType.hidden, conditionalPropertyContext)

  if (hidden) {
    return null
  }

  const readOnly =
    props.readOnly ||
    resolveConditionalProperty(props.schemaType.readOnly, conditionalPropertyContext)

  // Todo: improve error handling at the parent level so that the value here is either undefined or an array
  const items = Array.isArray(props.value) ? props.value : []

  const filteredPresence = props.presence.filter((item) => isEqual(item.path, props.path))
  const presence = filteredPresence.length ? filteredPresence : EMPTY_ARRAY
  const validation = props.validation
    .filter((item) => isEqual(item.path, props.path))
    .map((v) => ({level: v.level, message: v.item.message, path: v.path}))

  const members = items.flatMap((item, index) =>
    prepareArrayOfObjectsMember({
      arrayItem: item,
      parent: props,
      index,
    })
  )

  return {
    changed: members.some((m) => m.kind === 'item' && m.item.changed),
    value: props.value as T,
    readOnly,
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
}

/*
 * Takes a field in context of a parent object and returns prepared props for it
 */
function prepareArrayOfObjectsMember(props: {
  arrayItem: {_key: string}
  parent: RawState<ArraySchemaType, unknown>
  index: number
}): ArrayOfObjectsMember {
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

  const conditionalPropertyContext = {
    value: parent.value,
    parent: props.parent,
    document: parent.document,
    currentUser: parent.currentUser,
  }
  const readOnly =
    parent.readOnly ||
    resolveConditionalProperty(parent.schemaType.readOnly, conditionalPropertyContext)

  const fieldGroupState = parent.fieldGroupState?.children?.[key]
  const scopedCollapsedPaths = parent.collapsedPaths?.children?.[key]
  const scopedCollapsedFieldsets = parent.collapsedFieldSets?.children?.[key]
  const comparisonValue =
    (Array.isArray(parent.comparisonValue) &&
      parent.comparisonValue.find((i) => i._key === arrayItem._key)) ||
    undefined

  const itemState = prepareObjectInputState(
    {
      schemaType: itemType,
      level: itemLevel,
      document: parent.document,
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
      readOnly,
    },
    false
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
}

/*
 * Takes a field in contet of a parent object and returns prepared props for it
 */
function prepareArrayOfPrimitivesMember(props: {
  arrayItem: unknown
  parent: RawState<ArraySchemaType, unknown>
  index: number
}): ArrayOfPrimitivesMember {
  const {arrayItem, parent, index} = props
  const itemType = getPrimitiveItemType(parent.schemaType, arrayItem)

  const itemPath = pathFor([...parent.path, index])
  const itemValue = (parent.value as unknown[] | undefined)?.[index] as string | boolean | number
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

  const readOnly =
    parent.readOnly ||
    resolveConditionalProperty(itemType.readOnly, {
      value: itemValue,
      parent: parent.value,
      document: parent.document,
      currentUser: parent.currentUser,
    })

  const item = preparePrimitiveInputState({
    ...parent,
    path: itemPath,
    schemaType: itemType as PrimitiveSchemaType,
    level: itemLevel,
    value: itemValue,
    comparisonValue: itemComparisonValue,
    readOnly,
  })

  return {
    kind: 'item',
    key,
    index,
    parentSchemaType: parent.schemaType,
    open: isEqual(itemPath, parent.openPath),
    item,
  }
}

function preparePrimitiveInputState<SchemaType extends PrimitiveSchemaType>(
  props: RawState<SchemaType, unknown>
): PrimitiveFormNode {
  const filteredPresence = props.presence.filter((item) => isEqual(item.path, props.path))
  const presence = filteredPresence.length ? filteredPresence : EMPTY_ARRAY

  const validation = props.validation
    .filter((item) => isEqual(item.path, props.path))
    .map((v) => ({level: v.level, message: v.item.message, path: v.path}))
  return {
    schemaType: props.schemaType,
    changed: isChangedValue(props.value, props.comparisonValue),
    value: props.value,
    level: props.level,
    id: toString(props.path),
    readOnly: props.readOnly,
    focused: isEqual(props.path, props.focusPath),
    path: props.path,
    presence,
    validation,
  } as PrimitiveFormNode
}

/** @internal */
export type FIXME_SanityDocument = Record<string, unknown>

/** @internal */
export function prepareFormState<T extends FIXME_SanityDocument>(
  props: RawState<ObjectSchemaType, T>
): ObjectFormNode | null {
  return prepareObjectInputState(props)
}
