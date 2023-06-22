import {TestInfo} from '@playwright/test'

export const generateTestReport = (testInfo: TestInfo): any => {
  return {
    testName: testInfo.title,
    projectName: testInfo.project.name,
    testId: testInfo.testId,
    timestamp: new Date().toISOString(),
    // status: testInfo.status,
  }
}
