/**
 * E2E tests for Magic Mock functionality in the cli-vue example
 *
 * This example uses Vue CLI with Webpack and demonstrates Magic Mock
 * integration with the Webpack dev server middleware.
 *
 * All test logic is shared via createMagicMockTestSuite() to ensure
 * consistent testing across all example projects.
 */

import { createMagicMockTestSuite } from '../helpers/shared-test-suite'

createMagicMockTestSuite('cli-vue')
