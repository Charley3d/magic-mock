/**
 * E2E tests for Magic Mock functionality in the simple-jquery example
 *
 * This example uses standalone HTML with jQuery and demonstrates Magic Mock
 * in a non-bundled environment using XHR requests.
 *
 * All test logic is shared via createMagicMockTestSuite() to ensure
 * consistent testing across all example projects.
 */

import { createMagicMockTestSuite } from '../helpers/shared-test-suite'

createMagicMockTestSuite('simple-jquery')
