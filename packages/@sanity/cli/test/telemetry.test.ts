import {describeCliTest, testConcurrent} from './shared/describe'
import {runSanityCmdCommand} from './shared/environment'

describeCliTest('CLI: `sanity telemetry status`', () => {
  testConcurrent('sanity telemetry status: fetch error', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'status'])

    // TODO: Test successful request.
    expect(result.stdout).toMatchInlineSnapshot(`
"Could not fetch telemetry consent status.

Learn more here:
https://sanity.io/telemetry
"
`)
  })

  testConcurrent('sanity telemetry status: unset', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'status'], {
      env: {
        MOCK_CONSENT: 'unset',
      },
    })

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Not set

You've not set your preference for telemetry collection.

Run npx sanity telemetry enable/disable to opt in or out.
You can also use the DO_NOT_TRACK environment variable to opt out.

Learn more here:
https://sanity.io/telemetry
"
`)
  })

  testConcurrent('sanity telemetry status: granted', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'status'], {
      env: {
        MOCK_CONSENT: 'granted',
      },
    })

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Enabled

Telemetry data on general usage and errors is collected to help us improve Sanity.

Learn more about the data being collected here:
https://www.sanity.io/telemetry
"
`)
  })

  testConcurrent('sanity telemetry status: denied', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'status'], {
      env: {
        MOCK_CONSENT: 'denied',
      },
    })

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Disabled

You've opted out of telemetry data collection.
No data will be collected from your Sanity account.

Learn more here:
https://www.sanity.io/telemetry
"
`)
  })

  testConcurrent('sanity telemetry status: denied using DO_NOT_TRACK', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'status'], {
      env: {
        DO_NOT_TRACK: '1',
      },
    })

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Disabled

You've opted out of telemetry data collection.
No data will be collected from your machine.

Using DO_NOT_TRACK environment variable.


Learn more here:
https://www.sanity.io/telemetry
"
`)
  })
})

describeCliTest('CLI: `sanity telemetry enable`', () => {
  testConcurrent('sanity telemetry enable: success', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'enable'], {
      env: {
        MOCK_TELEMETRY_CONSENT_MODE: 'success',
      },
    })

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Enabled

You've now enabled telemetry data collection to help us improve Sanity.

Learn more about the data being collected here:
https://www.sanity.io/telemetry
"
`)
  })

  testConcurrent('sanity telemetry enable: success (already enabled)', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'enable'], {
      env: {
        MOCK_CONSENT: 'granted',
      },
    })

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Enabled

You've already enabled telemetry data collection to help us improve Sanity.

Learn more about the data being collected here:
https://www.sanity.io/telemetry
"
`)
  })
})

describeCliTest('CLI: `sanity telemetry disable`', () => {
  testConcurrent('sanity telemetry disable: success', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'disable'], {
      env: {
        MOCK_TELEMETRY_CONSENT_MODE: 'success',
      },
    })

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Disabled

You've opted out of telemetry data collection.
No data will be collected from your Sanity account.

Learn more here:
https://www.sanity.io/telemetry
"
`)
  })

  testConcurrent('sanity telemetry disable: success (already denied)', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'disable'], {
      env: {
        MOCK_CONSENT: 'denied',
      },
    })

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Disabled

You've already opted out of telemetry data collection.
No data is collected from your Sanity account.

Learn more here:
https://www.sanity.io/telemetry
"
`)
  })

  testConcurrent(
    'sanity telemetry disable: success (already denied using DO_NOT_TRACK)',
    async () => {
      const result = await runSanityCmdCommand('v3', ['telemetry', 'disable'], {
        env: {
          DO_NOT_TRACK: '1',
        },
      })

      expect(result.stdout).toMatchInlineSnapshot(`
"Status: Disabled

You've already opted out of telemetry data collection.
No data is collected from your Sanity account.

Learn more here:
https://www.sanity.io/telemetry
"
`)
    },
  )
})
