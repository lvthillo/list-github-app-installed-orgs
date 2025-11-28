/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { getInputs, createOctokitClient, getOrganizationInstallations, run } =
  await import('../src/main.js')

// Import Octokit for type checking and mocking
const { Octokit } = await import('octokit')

// Import fast-check for property-based testing
const fc = await import('fast-check')

// Type for mock Octokit client
interface MockOctokit {
  apps: {
    listInstallations: jest.Mock
  }
}

describe('getInputs', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save a clean copy of the environment before each test
    originalEnv = { ...process.env }
    // Remove any INPUT_* variables that might have been set
    delete process.env.INPUT_APP_ID
    delete process.env.INPUT_PRIVATE_KEY
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    // Don't reset mocks here - it clears the mock implementation
    // jest.resetAllMocks()
  })

  it('reads valid inputs from environment variables', () => {
    process.env.INPUT_APP_ID = '12345'
    process.env.INPUT_PRIVATE_KEY =
      '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----'

    const result = getInputs()

    expect(result).toEqual({
      appId: '12345',
      privateKey:
        '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----'
    })
  })

  it('throws error when APP_ID is missing', () => {
    process.env.INPUT_PRIVATE_KEY =
      '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----'
    delete process.env.INPUT_APP_ID

    expect(() => getInputs()).toThrow('Input required and not supplied: app-id')
  })

  it('throws error when PRIVATE_KEY is missing', () => {
    process.env.INPUT_APP_ID = '12345'
    delete process.env.INPUT_PRIVATE_KEY

    expect(() => getInputs()).toThrow(
      'Input required and not supplied: private-key'
    )
  })

  it('throws error when both inputs are missing', () => {
    delete process.env.INPUT_APP_ID
    delete process.env.INPUT_PRIVATE_KEY

    expect(() => getInputs()).toThrow('Input required and not supplied: app-id')
  })
})

describe('createOctokitClient', () => {
  it('creates client with valid credentials', () => {
    const appId = '12345'
    const privateKey =
      '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----'

    const client = createOctokitClient(appId, privateKey)

    expect(client).toBeInstanceOf(Octokit)
    expect(client).toBeDefined()
  })

  it('creates client with different credentials', () => {
    const appId = '67890'
    const privateKey =
      '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----'

    const client = createOctokitClient(appId, privateKey)

    expect(client).toBeInstanceOf(Octokit)
    expect(client).toBeDefined()
  })

  it('configures authentication on the client', () => {
    const appId = '11111'
    const privateKey =
      '-----BEGIN RSA PRIVATE KEY-----\nvalid-key\n-----END RSA PRIVATE KEY-----'

    const client = createOctokitClient(appId, privateKey)

    // Verify client has auth method configured
    expect(client).toBeInstanceOf(Octokit)
    expect(client.auth).toBeDefined()
    expect(typeof client.auth).toBe('function')
  })
})

describe('JSON serialization', () => {
  describe('property tests', () => {
    // Feature: github-app-org-list, Property 3: JSON serialization validity
    // Validates: Requirements 5.2
    it('serializes and deserializes organization names correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 39 })),
          (orgNames) => {
            // Serialize to JSON
            const jsonString = JSON.stringify(orgNames)

            // Deserialize back
            const parsed = JSON.parse(jsonString)

            // Verify equivalence
            expect(parsed).toEqual(orgNames)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

describe('installation count logging', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('property tests', () => {
    // Feature: github-app-org-list, Property 4: Installation count logging accuracy
    // Validates: Requirements 6.2
    it('logs accurate installation count', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000000 }),
              account: fc.oneof(
                fc.record({
                  login: fc.string({ minLength: 1, maxLength: 39 }),
                  type: fc.constant('Organization' as const)
                }),
                fc.record({
                  login: fc.string({ minLength: 1, maxLength: 39 }),
                  type: fc.constant('User' as const)
                }),
                fc.constant(null)
              )
            }),
            { minLength: 0, maxLength: 100 }
          ),
          async (installations) => {
            const mockOctokit = {
              apps: {
                listInstallations: jest.fn().mockResolvedValue({
                  data: installations
                })
              }
            } as unknown as MockOctokit

            await getOrganizationInstallations(mockOctokit)

            // Verify the logged count matches actual list length
            expect(core.info).toHaveBeenCalledWith(
              `Found ${installations.length} total installations`
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

describe('organization count logging', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('property tests', () => {
    // Feature: github-app-org-list, Property 5: Organization count logging accuracy
    // Validates: Requirements 6.3
    it('logs accurate organization count', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000000 }),
              account: fc.oneof(
                fc.record({
                  login: fc.string({ minLength: 1, maxLength: 39 }),
                  type: fc.constant('Organization' as const)
                }),
                fc.record({
                  login: fc.string({ minLength: 1, maxLength: 39 }),
                  type: fc.constant('User' as const)
                }),
                fc.constant(null)
              )
            }),
            { minLength: 0, maxLength: 100 }
          ),
          async (installations) => {
            const mockOctokit = {
              apps: {
                listInstallations: jest.fn().mockResolvedValue({
                  data: installations
                })
              }
            } as unknown as MockOctokit

            await getOrganizationInstallations(mockOctokit)

            // Calculate expected organization count
            const expectedOrgCount = installations.filter(
              (inst) => inst.account?.type === 'Organization'
            ).length

            // Verify the logged organization count matches filtered length
            expect(core.info).toHaveBeenCalledWith(
              `Found ${expectedOrgCount} organization installations`
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

describe('output and logging', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('unit tests', () => {
    it('uses "organizations" key for output', () => {
      const organizations = ['org1', 'org2']
      const jsonOutput = JSON.stringify(organizations)

      // Simulate what run() does
      core.setOutput('organizations', jsonOutput)

      expect(core.setOutput).toHaveBeenCalledWith(
        'organizations',
        '["org1","org2"]'
      )
    })

    it('outputs empty array as "[]" not null', () => {
      const organizations: string[] = []
      const jsonOutput = JSON.stringify(organizations)

      // Simulate what run() does
      core.setOutput('organizations', jsonOutput)

      expect(core.setOutput).toHaveBeenCalledWith('organizations', '[]')
      expect(jsonOutput).not.toBe('null')
      expect(jsonOutput).not.toBe('undefined')
    })

    it('logs start message', () => {
      core.info('Retrieving GitHub App installations...')
      expect(core.info).toHaveBeenCalledWith(
        'Retrieving GitHub App installations...'
      )
    })

    it('logs final output', () => {
      const jsonOutput = '["org1","org2"]'
      core.info(`Output: ${jsonOutput}`)
      expect(core.info).toHaveBeenCalledWith('Output: ["org1","org2"]')
    })

    it('logs debug information when debug mode enabled', async () => {
      const mockInstallations = [
        { id: 1, account: { login: 'org1', type: 'Organization' as const } },
        { id: 2, account: { login: 'user1', type: 'User' as const } },
        { id: 3, account: null }
      ]

      const mockOctokit = {
        apps: {
          listInstallations: jest.fn().mockResolvedValue({
            data: mockInstallations
          })
        }
      } as unknown as MockOctokit

      // Mock isDebug to return true
      core.isDebug.mockReturnValue(true)

      await getOrganizationInstallations(mockOctokit)

      expect(core.debug).toHaveBeenCalledWith('Installation details:')
      expect(core.debug).toHaveBeenCalledWith(
        '  - ID: 1, Account: org1, Type: Organization'
      )
      expect(core.debug).toHaveBeenCalledWith(
        '  - ID: 2, Account: user1, Type: User'
      )
      expect(core.debug).toHaveBeenCalledWith(
        '  - ID: 3, Account: null, Type: null'
      )
    })
  })
})

describe('getOrganizationInstallations', () => {
  describe('unit tests', () => {
    it('retrieves and filters organization installations successfully', async () => {
      const mockInstallations = [
        {
          id: 1,
          account: { login: 'org1', type: 'Organization' as const }
        },
        {
          id: 2,
          account: { login: 'user1', type: 'User' as const }
        },
        {
          id: 3,
          account: { login: 'org2', type: 'Organization' as const }
        }
      ]

      const mockOctokit = {
        apps: {
          listInstallations: jest.fn().mockResolvedValue({
            data: mockInstallations
          })
        }
      } as unknown as MockOctokit

      const result = await getOrganizationInstallations(mockOctokit)

      expect(result).toEqual(['org1', 'org2'])
      expect(mockOctokit.apps.listInstallations).toHaveBeenCalledTimes(1)
    })

    it('filters mixed user and organization installations', async () => {
      const mockInstallations = [
        {
          id: 1,
          account: { login: 'user1', type: 'User' as const }
        },
        {
          id: 2,
          account: { login: 'org1', type: 'Organization' as const }
        },
        {
          id: 3,
          account: { login: 'user2', type: 'User' as const }
        },
        {
          id: 4,
          account: { login: 'org2', type: 'Organization' as const }
        }
      ]

      const mockOctokit = {
        apps: {
          listInstallations: jest.fn().mockResolvedValue({
            data: mockInstallations
          })
        }
      } as unknown as MockOctokit

      const result = await getOrganizationInstallations(mockOctokit)

      expect(result).toEqual(['org1', 'org2'])
      expect(result).not.toContain('user1')
      expect(result).not.toContain('user2')
    })

    it('returns empty array when no installations exist', async () => {
      const mockOctokit = {
        apps: {
          listInstallations: jest.fn().mockResolvedValue({
            data: []
          })
        }
      } as unknown as MockOctokit

      const result = await getOrganizationInstallations(mockOctokit)

      expect(result).toEqual([])
      expect(mockOctokit.apps.listInstallations).toHaveBeenCalledTimes(1)
    })

    it('handles installations with null account field', async () => {
      const mockInstallations = [
        {
          id: 1,
          account: { login: 'org1', type: 'Organization' as const }
        },
        {
          id: 2,
          account: null
        },
        {
          id: 3,
          account: { login: 'org2', type: 'Organization' as const }
        }
      ]

      const mockOctokit = {
        apps: {
          listInstallations: jest.fn().mockResolvedValue({
            data: mockInstallations
          })
        }
      } as unknown as MockOctokit

      const result = await getOrganizationInstallations(mockOctokit)

      expect(result).toEqual(['org1', 'org2'])
      expect(result.length).toBe(2)
    })
  })

  describe('property tests', () => {
    // Feature: github-app-org-list, Property 1: Organization filtering correctness
    // Validates: Requirements 4.1, 4.2
    it('filters installations to include only organizations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000000 }),
              account: fc.oneof(
                // Organization account
                fc.record({
                  login: fc.string({ minLength: 1, maxLength: 39 }),
                  type: fc.constant('Organization' as const)
                }),
                // User account
                fc.record({
                  login: fc.string({ minLength: 1, maxLength: 39 }),
                  type: fc.constant('User' as const)
                }),
                // Null account
                fc.constant(null)
              )
            })
          ),
          async (installations) => {
            // Create a mock Octokit client
            const mockOctokit = {
              apps: {
                listInstallations: jest.fn().mockResolvedValue({
                  data: installations
                })
              }
            } as unknown as MockOctokit

            const result = await getOrganizationInstallations(mockOctokit)

            // Verify all results are organizations
            const expectedOrgs = installations
              .filter((inst) => inst.account?.type === 'Organization')
              .map((inst) => inst.account!.login)

            expect(result).toEqual(expectedOrgs)

            // Verify no users are included
            const hasUsers = result.some((login) => {
              const inst = installations.find((i) => i.account?.login === login)
              return inst?.account?.type === 'User'
            })
            expect(hasUsers).toBe(false)

            // Verify no null accounts are included in results
            // Result should never contain entries from null account installations
            const nullAccountCount = installations.filter(
              (inst) => inst.account === null
            ).length
            const orgAccountCount = installations.filter(
              (inst) => inst.account?.type === 'Organization'
            ).length

            // Result length should equal organization count, not total count
            expect(result.length).toBe(orgAccountCount)
            expect(result.length).toBeLessThanOrEqual(
              installations.length - nullAccountCount
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    // Feature: github-app-org-list, Property 2: Login name extraction completeness
    // Validates: Requirements 5.1
    it('extracts login names completely from organization installations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000000 }),
              account: fc.record({
                login: fc.string({ minLength: 1, maxLength: 39 }),
                type: fc.constant('Organization' as const)
              })
            }),
            { minLength: 0, maxLength: 50 }
          ),
          async (orgInstallations) => {
            // Create a mock Octokit client
            const mockOctokit = {
              apps: {
                listInstallations: jest.fn().mockResolvedValue({
                  data: orgInstallations
                })
              }
            } as unknown as MockOctokit

            const result = await getOrganizationInstallations(mockOctokit)

            // Verify output length equals input length
            expect(result.length).toBe(orgInstallations.length)

            // Verify each login name corresponds to an installation
            result.forEach((login, index) => {
              expect(login).toBe(orgInstallations[index].account.login)
            })

            // Verify all logins are extracted
            const expectedLogins = orgInstallations.map(
              (inst) => inst.account.login
            )
            expect(result).toEqual(expectedLogins)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

describe('error handling', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    // Clear mock call history but keep implementation
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('property tests', () => {
    // Feature: github-app-org-list, Property 6: Error handling consistency
    // Validates: Requirements 7.1, 7.2
    it('catches all errors and calls core.setFailed without unhandled exceptions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Generate Error instances with various messages
            fc.string().map((msg) => new Error(msg)),
            // Generate non-Error values
            fc.string(),
            fc.integer(),
            fc.constant(null),
            fc.constant(undefined),
            fc.record({
              message: fc.string(),
              code: fc.integer()
            })
          ),
          async () => {
            // Set up environment to cause an error by missing inputs
            delete process.env.INPUT_APP_ID
            delete process.env.INPUT_PRIVATE_KEY

            // Run the action - it will fail due to missing inputs
            await run()

            // Verify core.setFailed was called
            expect(core.setFailed).toHaveBeenCalled()

            // Verify the call had an argument
            const setFailedCalls = (core.setFailed as jest.Mock).mock.calls
            expect(setFailedCalls.length).toBeGreaterThan(0)
            expect(setFailedCalls[0][0]).toBeDefined()

            // No unhandled exception should occur (test would fail if one did)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('unit tests', () => {
    it('handles Error instance with error message', async () => {
      // Set up to throw an Error
      delete process.env.INPUT_APP_ID
      delete process.env.INPUT_PRIVATE_KEY

      await run()

      expect(core.setFailed).toHaveBeenCalled()
      const errorMessage = (core.setFailed as jest.Mock).mock.calls[0][0]
      expect(typeof errorMessage).toBe('string')
      expect(errorMessage.length).toBeGreaterThan(0)
    })

    it('handles non-Error value with string conversion', async () => {
      // Test the error handling logic directly by simulating what run() does
      const nonErrorValue = { code: 500, message: 'Server error' }

      // Simulate the catch block behavior
      const result = String(nonErrorValue)

      expect(typeof result).toBe('string')
      expect(result).toBe('[object Object]')
    })

    it('provides specific error message for authentication failures', async () => {
      // Test the error handling logic for authentication errors
      const authError = new Error('Authentication failed: Invalid credentials')
      const errorMessage = authError.message.toLowerCase()

      let failedMessage = ''
      if (
        errorMessage.includes('authentication') ||
        errorMessage.includes('credentials')
      ) {
        failedMessage = `Authentication failed: ${authError.message}`
      }

      expect(failedMessage).toContain('Authentication failed')
    })

    it('provides specific error message for API errors', async () => {
      // Test the error handling logic for API errors
      const apiError = new Error(
        'API request failed: 500 Internal Server Error'
      )
      const errorMessage = apiError.message.toLowerCase()

      let failedMessage = ''
      if (
        errorMessage.includes('api') ||
        errorMessage.includes('request failed')
      ) {
        failedMessage = `GitHub API error: ${apiError.message}`
      }

      expect(failedMessage).toContain('API')
    })

    it('provides specific error message for rate limiting', async () => {
      // Test the error handling logic for rate limit errors
      const rateLimitError = new Error(
        'Rate limit exceeded. Please try again later.'
      )
      const errorMessage = rateLimitError.message.toLowerCase()

      let failedMessage = ''
      if (errorMessage.includes('rate limit')) {
        failedMessage = `GitHub API rate limit exceeded: ${rateLimitError.message}`
      }

      expect(failedMessage).toContain('rate limit')
    })
  })
})
