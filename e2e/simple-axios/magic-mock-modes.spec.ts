/**
 * E2E tests for Magic Mock functionality in the simple-axios example
 *
 * This example uses standalone HTML with Axios and demonstrates Magic Mock
 * in a non-bundled environment using the fetch API via Axios.
 *
 * All test logic is shared via createMagicMockTestSuite() to ensure
 * consistent testing across all example projects.
 */

import { createMagicMockTestSuite } from '../helpers/shared-test-suite'

createMagicMockTestSuite('simple-axios')
