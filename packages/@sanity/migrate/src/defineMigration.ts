import type {Migration} from './types'

export function defineMigration<T extends Migration>(migration: T): T {
  return migration
}
