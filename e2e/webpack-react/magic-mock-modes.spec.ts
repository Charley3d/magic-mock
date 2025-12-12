/**
 * E2E tests for Magic Mock functionality in the webpack-react example
 *
 * This example uses React 18 with Webpack 5 and demonstrates Magic Mock
 * integration with the Webpack dev server middleware and filesystem caching.
 *
 * All test logic is shared via createMagicMockTestSuite() to ensure
 * consistent testing across all example projects.
 */

import { createMagicMockTestSuite } from '../helpers/shared-test-suite'

createMagicMockTestSuite('webpack-react')
