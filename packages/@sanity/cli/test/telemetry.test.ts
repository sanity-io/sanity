import {describeCliTest} from './shared/describe'
import {runSanityCmdCommand} from './shared/environment'

describeCliTest('CLI: `sanity telemetry status`', () => {
  test.skip('sanity telemetry status: granted', async () => {
    await runSanityCmdCommand('v3', ['telemetry', 'enable'], {
      env: {
        DEBUG: 'sanity:*',
        CI: 'false',
      },
    })

    const result = await runSanityCmdCommand('v3', ['telemetry', 'status'], {
      env: {
        CI: 'false',
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

  test.skip('sanity telemetry status: denied', async () => {
    await runSanityCmdCommand('v3', ['telemetry', 'disable'], {
      env: {
        CI: 'false',
      },
    })

    const result = await runSanityCmdCommand('v3', ['telemetry', 'status'], {
      env: {
        CI: 'false',
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

  test.skip('sanity telemetry status: denied using DO_NOT_TRACK', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'status'], {
      env: {
        CI: 'false',
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
  test.skip('sanity telemetry enable: success', async () => {
    await runSanityCmdCommand('v3', ['telemetry', 'disable'], {
      env: {
        CI: 'false',
      },
    })

    const result = await runSanityCmdCommand('v3', ['telemetry', 'enable'], {
      env: {
        CI: 'false',
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

  test.skip('sanity telemetry enable: success (already enabled)', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'enable'], {
      env: {
        CI: 'false',
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
  test.skip('sanity telemetry disable: success', async () => {
    await runSanityCmdCommand('v3', ['telemetry', 'enable'], {
      env: {
        CI: 'false',
      },
    })

    const result = await runSanityCmdCommand('v3', ['telemetry', 'disable'], {
      env: {
        CI: 'false',
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

  test.skip('sanity telemetry disable: success (already denied)', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'disable'], {
      env: {
        CI: 'false',
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

  test.skip('sanity telemetry disable: success (already denied using DO_NOT_TRACK)', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'disable'], {
      env: {
        CI: 'false',
        DO_NOT_TRACK: '1',
      },
    })

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Disabled

You've already opted out of telemetry data collection.
No data is collected from your machine.

Using DO_NOT_TRACK environment variable.

Learn more here:
https://www.sanity.io/telemetry
"
`)
  })
})
