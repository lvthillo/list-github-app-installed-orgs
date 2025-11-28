import type * as core from '@actions/core'
import { jest } from '@jest/globals'

export const debug = jest.fn<typeof core.debug>()
export const error = jest.fn<typeof core.error>()
export const info = jest.fn<typeof core.info>()
export const getInput = jest
  .fn<typeof core.getInput>()
  .mockImplementation((name, options) => {
    // Simulate @actions/core behavior: read from INPUT_<NAME> env var
    const envVarName = `INPUT_${name.replace(/ /g, '_').replace(/-/g, '_').toUpperCase()}`
    const val = process.env[envVarName] || ''

    if (options?.required && !val) {
      throw new Error(`Input required and not supplied: ${name}`)
    }

    return val
  })
export const setOutput = jest.fn<typeof core.setOutput>()
export const setFailed = jest.fn<typeof core.setFailed>()
export const warning = jest.fn<typeof core.warning>()
export const isDebug = jest.fn<typeof core.isDebug>().mockReturnValue(false)
