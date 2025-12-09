/**
 * E2E tests for Magic Mock functionality in the vite-vue example
 *
 * This example uses Vue 3 with Vite and demonstrates Magic Mock
 * integration with the Vite dev server middleware and filesystem caching.
 *
 * All test logic is shared via createMagicMockTestSuite() to ensure
 * consistent testing across all example projects.
 */

import { createMagicMockTestSuite } from '../helpers/shared-test-suite'

createMagicMockTestSuite('vite-vue')
