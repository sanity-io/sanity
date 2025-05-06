import {describe, expect, it} from 'vitest'

import addBlueprintsCommand from '../src/commands/blueprints/addBlueprintsCommand'
import configBlueprintsCommand from '../src/commands/blueprints/configBlueprintsCommand'
import deployBlueprintsCommand from '../src/commands/blueprints/deployBlueprintsCommand'
import destroyBlueprintsCommand from '../src/commands/blueprints/destroyBlueprintsCommand'
import infoBlueprintsCommand from '../src/commands/blueprints/infoBlueprintsCommand'
import initBlueprintsCommand from '../src/commands/blueprints/initBlueprintsCommand'
import logsBlueprintsCommand from '../src/commands/blueprints/logsBlueprintsCommand'
import planBlueprintsCommand from '../src/commands/blueprints/planBlueprintsCommand'
import stacksBlueprintsCommand from '../src/commands/blueprints/stacksBlueprintsCommand'

describe('blueprints commands', () => {
  it('should be a set of commands', async () => {
    expect(addBlueprintsCommand).toBeDefined()
    expect(configBlueprintsCommand).toBeDefined()
    expect(deployBlueprintsCommand).toBeDefined()
    expect(destroyBlueprintsCommand).toBeDefined()
    expect(infoBlueprintsCommand).toBeDefined()
    expect(initBlueprintsCommand).toBeDefined()
    expect(logsBlueprintsCommand).toBeDefined()
    expect(planBlueprintsCommand).toBeDefined()
    expect(stacksBlueprintsCommand).toBeDefined()
  })
})
