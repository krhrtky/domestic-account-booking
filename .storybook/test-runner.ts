import type { TestRunnerConfig } from '@storybook/test-runner'
import { toMatchImageSnapshot } from 'jest-image-snapshot'

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot })
  },
  async postVisit(page, context) {
    if (process.env.STORYBOOK_VRT === 'true') {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      const image = await page.screenshot()
      expect(image).toMatchImageSnapshot({
        customSnapshotsDir: `.storybook/__snapshots__`,
        customSnapshotIdentifier: context.id.replace(/--/g, '-'),
        failureThreshold: 0.01,
        failureThresholdType: 'percent',
      })
    }
  },
}

export default config
