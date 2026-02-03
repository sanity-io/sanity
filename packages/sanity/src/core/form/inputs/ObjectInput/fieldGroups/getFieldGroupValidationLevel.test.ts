import {ALL_FIELDS_GROUP_NAME} from '@sanity/schema/_internal'
import {type FormNodeValidation, type ObjectField} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {type FormFieldGroup} from '../../../store'
import {getFieldGroupValidationLevel} from './getFieldGroupValidationLevel'

describe('getFieldGroupValidationLevel', () => {
  const createGroup = (fieldName: string, groupName: string = 'group1'): FormFieldGroup => ({
    name: groupName,
    title: 'Test Group',
    fields: [
      {
        name: fieldName,
        group: groupName,
      },
    ] as ObjectField[],
  })

  const createValidation = (
    level: 'error' | 'warning' | 'info',
    path: string[],
  ): FormNodeValidation => ({
    message: 'Test message',
    level,
    path,
  })

  describe('single validation level', () => {
    test('should return error for error validation at root level', () => {
      const validation = [createValidation('error', ['fieldName'])]
      const group = createGroup('fieldName')

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('error')
    })

    test('should return warning for warning validation', () => {
      const validation = [createValidation('warning', ['fieldName'])]
      const group = createGroup('fieldName')

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('warning')
    })

    test('should return info for info validation', () => {
      const validation = [createValidation('info', ['fieldName'])]
      const group = createGroup('fieldName')

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('info')
    })

    test('should return undefined when no validations match the group', () => {
      const validation = [createValidation('error', ['otherField'])]
      const group = createGroup('fieldName')

      expect(getFieldGroupValidationLevel(group, [], validation)).toBeUndefined()
    })

    test('should return undefined when validations array is empty', () => {
      const group = createGroup('fieldName')

      expect(getFieldGroupValidationLevel(group, [], [])).toBeUndefined()
    })
  })

  describe('mixed validation levels - priority order: error > warning > info', () => {
    test('should return error when mixed with warning', () => {
      const validation = [
        createValidation('warning', ['fieldName']),
        createValidation('error', ['fieldName']),
      ]
      const group = createGroup('fieldName')

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('error')
    })

    test('should return error when mixed with info', () => {
      const validation = [
        createValidation('info', ['fieldName']),
        createValidation('error', ['fieldName']),
      ]
      const group = createGroup('fieldName')

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('error')
    })

    test('should return error when mixed with warning and info', () => {
      const validation = [
        createValidation('info', ['fieldName']),
        createValidation('warning', ['fieldName']),
        createValidation('error', ['fieldName']),
      ]
      const group = createGroup('fieldName')

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('error')
    })

    test('should return warning when mixed with info (no error)', () => {
      const validation = [
        createValidation('info', ['fieldName']),
        createValidation('warning', ['fieldName']),
      ]
      const group = createGroup('fieldName')

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('warning')
    })

    test('should return warning when info comes first', () => {
      const validation = [
        createValidation('info', ['fieldName']),
        createValidation('info', ['fieldName']),
        createValidation('warning', ['fieldName']),
      ]
      const group = createGroup('fieldName')

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('warning')
    })
  })

  describe('nested paths', () => {
    test('should return validation level for nested group path', () => {
      const validation = [createValidation('error', ['parent', 'child'])]
      const group = createGroup('child')

      expect(getFieldGroupValidationLevel(group, ['parent'], validation)).toBe('error')
    })

    test('should return validation level for deeply nested paths', () => {
      const validation = [createValidation('warning', ['level1', 'level2', 'level3'])]
      const group = createGroup('level3')

      expect(getFieldGroupValidationLevel(group, ['level1', 'level2'], validation)).toBe('warning')
    })
  })

  describe('multiple fields in group', () => {
    test('should return highest level across multiple fields', () => {
      const validation = [
        createValidation('info', ['field1']),
        createValidation('warning', ['field2']),
      ]
      const group: FormFieldGroup = {
        name: 'group1',
        title: 'Test Group',
        fields: [
          {name: 'field1', group: 'group1'},
          {name: 'field2', group: 'group1'},
        ] as ObjectField[],
      }

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('warning')
    })

    test('should return error if any field has error', () => {
      const validation = [
        createValidation('info', ['field1']),
        createValidation('warning', ['field2']),
        createValidation('error', ['field3']),
      ]
      const group: FormFieldGroup = {
        name: 'group1',
        title: 'Test Group',
        fields: [
          {name: 'field1', group: 'group1'},
          {name: 'field2', group: 'group1'},
          {name: 'field3', group: 'group1'},
        ] as ObjectField[],
      }

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('error')
    })
  })

  describe('all-fields group (special case)', () => {
    const createAllFieldsGroup = (): FormFieldGroup => ({
      name: ALL_FIELDS_GROUP_NAME,
      title: 'All Fields',
      fields: [] as ObjectField[],
    })

    test('should return error for any error validation regardless of path', () => {
      const validation = [createValidation('error', ['anyField', 'nested'])]
      const group = createAllFieldsGroup()

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('error')
    })

    test('should return warning for any warning validation regardless of path', () => {
      const validation = [createValidation('warning', ['someOther', 'path'])]
      const group = createAllFieldsGroup()

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('warning')
    })

    test('should return info for any info validation regardless of path', () => {
      const validation = [createValidation('info', ['deep', 'nested', 'path'])]
      const group = createAllFieldsGroup()

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('info')
    })

    test('should return undefined when validations array is empty', () => {
      const group = createAllFieldsGroup()

      expect(getFieldGroupValidationLevel(group, [], [])).toBeUndefined()
    })

    test('should return highest priority level from mixed validations', () => {
      const validation = [
        createValidation('info', ['path1']),
        createValidation('warning', ['path2']),
        createValidation('error', ['path3']),
      ]
      const group = createAllFieldsGroup()

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('error')
    })

    test('should return warning when no error present', () => {
      const validation = [
        createValidation('info', ['path1']),
        createValidation('warning', ['path2']),
      ]
      const group = createAllFieldsGroup()

      expect(getFieldGroupValidationLevel(group, [], validation)).toBe('warning')
    })
  })
})
