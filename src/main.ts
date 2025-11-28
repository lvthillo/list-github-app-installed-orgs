import * as core from '@actions/core'
import { Octokit } from 'octokit'
import { createAppAuth } from '@octokit/auth-app'

/**
 * Retrieves and validates the required inputs for the action.
 *
 * @returns An object containing the validated appId and privateKey
 * @throws Error if either app-id or private-key is missing
 */
export function getInputs(): { appId: string; privateKey: string } {
  const appId = core.getInput('app-id', { required: true })
  const privateKey = core.getInput('private-key', { required: true })

  return { appId, privateKey }
}

/**
 * Creates an authenticated Octokit client using GitHub App credentials.
 *
 * @param appId - The GitHub App ID
 * @param privateKey - The GitHub App private key in PEM format
 * @returns An authenticated Octokit instance
 */
export function createOctokitClient(
  appId: string,
  privateKey: string
): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey
    }
  })
}

/**
 * Type definition for an installation account
 */
interface InstallationAccount {
  login: string
  type: 'User' | 'Organization'
}

/**
 * Type definition for an installation
 */
interface Installation {
  id: number
  account: InstallationAccount | null
}

/**
 * Type definition for Octokit with apps API
 */
interface OctokitWithApps {
  rest: {
    apps: {
      listInstallations: () => Promise<{ data: Installation[] }>
    }
  }
}

/**
 * Retrieves all organization installations for the authenticated GitHub App.
 *
 * @param octokit - An authenticated Octokit client (with apps API)
 * @returns A promise that resolves to an array of organization login names
 */
export async function getOrganizationInstallations(
  octokit: Octokit | OctokitWithApps
): Promise<string[]> {
  // Retrieve all installations for the GitHub App
  const { data: installations } = await (
    octokit as OctokitWithApps
  ).rest.apps.listInstallations()

  // Log total installation count
  core.info(`Found ${installations.length} total installations`)

  // Add debug logging for detailed installation information
  if (core.isDebug()) {
    core.debug('Installation details:')
    installations.forEach((inst: Installation) => {
      core.debug(
        `  - ID: ${inst.id}, Account: ${inst.account?.login || 'null'}, Type: ${inst.account?.type || 'null'}`
      )
    })
  }

  // Filter for organization installations and extract login names
  const orgNames = (installations as Installation[])
    .filter((installation: Installation) => {
      // Safely check if account exists and type is Organization
      return installation.account?.type === 'Organization'
    })
    .map((installation: Installation) => {
      // Extract login name (we know account exists due to filter)
      return installation.account!.login
    })

  // Log organization count
  core.info(`Found ${orgNames.length} organization installations`)

  return orgNames
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    core.info('Retrieving GitHub App installations...')

    // Get and validate inputs
    const { appId, privateKey } = getInputs()

    // Create authenticated Octokit client
    const octokit = createOctokitClient(appId, privateKey)

    // Get organization installations
    const organizations = await getOrganizationInstallations(octokit)

    // Serialize to JSON
    const jsonOutput = JSON.stringify(organizations)

    // Set action output
    core.setOutput('organizations', jsonOutput)

    // Log final output
    core.info(`Output: ${jsonOutput}`)
  } catch (error) {
    // Handle all errors and fail the action appropriately
    if (error instanceof Error) {
      // Check for specific error types and provide detailed messages
      const errorMessage = error.message.toLowerCase()

      if (
        errorMessage.includes('authentication') ||
        errorMessage.includes('credentials')
      ) {
        core.setFailed(`Authentication failed: ${error.message}`)
      } else if (errorMessage.includes('rate limit')) {
        core.setFailed(`GitHub API rate limit exceeded: ${error.message}`)
      } else if (
        errorMessage.includes('api') ||
        errorMessage.includes('request failed')
      ) {
        core.setFailed(`GitHub API error: ${error.message}`)
      } else {
        core.setFailed(error.message)
      }
    } else {
      // Handle non-Error values by converting to string
      core.setFailed(String(error))
    }
  }
}
