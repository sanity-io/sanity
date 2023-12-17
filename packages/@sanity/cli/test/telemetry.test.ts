import {describeCliTest, testConcurrent} from './shared/describe'
import {runSanityCmdCommand} from './shared/environment'

describeCliTest('CLI: `sanity telemetry status`', () => {
  test('sanity telemetry status: granted', async () => {
    await runSanityCmdCommand('v3', ['telemetry', 'enable'])
    const result = await runSanityCmdCommand('v3', ['telemetry', 'status'])

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Enabled

Telemetry data on general usage and errors is collected to help us improve Sanity.

Learn more about the data being collected here:
https://www.sanity.io/telemetry
"
`)
  })

  test('sanity telemetry status: denied', async () => {
    await runSanityCmdCommand('v3', ['telemetry', 'disable'])
    const result = await runSanityCmdCommand('v3', ['telemetry', 'status'])

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Disabled

You've opted out of telemetry data collection.
No data will be collected from your Sanity account.

Learn more here:
https://www.sanity.io/telemetry
"
`)
  })

  test('sanity telemetry status: denied using DO_NOT_TRACK', async () => {
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
  test('sanity telemetry enable: success', async () => {
    await runSanityCmdCommand('v3', ['telemetry', 'disable'])
    const result = await runSanityCmdCommand('v3', ['telemetry', 'enable'])

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Enabled

You've now enabled telemetry data collection to help us improve Sanity.

Learn more about the data being collected here:
https://www.sanity.io/telemetry
"
`)
  })

  test('sanity telemetry enable: success (already enabled)', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'enable'])

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
  test('sanity telemetry disable: success', async () => {
    await runSanityCmdCommand('v3', ['telemetry', 'enable'])
    const result = await runSanityCmdCommand('v3', ['telemetry', 'disable'])

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Disabled

You've opted out of telemetry data collection.
No data will be collected from your Sanity account.

Learn more here:
https://www.sanity.io/telemetry
"
`)
  })

  test('sanity telemetry disable: success (already denied)', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'disable'])

    expect(result.stdout).toMatchInlineSnapshot(`
"Status: Disabled

You've already opted out of telemetry data collection.
No data is collected from your Sanity account.

Learn more here:
https://www.sanity.io/telemetry
"
`)
  })

  test('sanity telemetry disable: success (already denied using DO_NOT_TRACK)', async () => {
    const result = await runSanityCmdCommand('v3', ['telemetry', 'disable'], {
      env: {
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
