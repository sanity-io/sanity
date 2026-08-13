import {expect} from '@playwright/test'

import {takeChromaticSnapshot, test} from '../../studio-test'

test('fields groups can use/not use i18n titles', async ({page, createDraftDocument}, testInfo) => {
  await createDraftDocument('/content/input-debug;field-groups;fieldGroupsWithI18n')

  await expect(page.getByTestId(`group-tab-i18n-group1`)).toBeVisible()

  // Should be translated (see e2e studio `i18n/bundles`)
  await expect(page.getByTestId('group-tab-i18n-group1')).toHaveText('🇺🇸 Group 1')
  // Should intentionally not be translated, eg show the missing key
  await expect(page.getByTestId('group-tab-i18n-group2')).toHaveText('intentionally-missing-key')
  // Should show defined title if no `i18n` key is defined
  await expect(page.getByTestId('group-tab-non-i18n-group3')).toHaveText('🌐 Non-i18n group')

  // Snapshot a freshly created draft form: schema-driven field groups with no
  // typed content, so the state is deterministic across runs.
  await takeChromaticSnapshot(page, 'document form with field groups', testInfo)
})
