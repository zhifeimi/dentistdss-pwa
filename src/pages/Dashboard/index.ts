/**
 * Dashboard entry point.
 *
 * Compatibility module: re-exports only the default Dashboard component.
 * The previous all-pages named re-exports were removed because any import of
 * this barrel pulled every dashboard page into the eager entry chunk.
 * Import dashboard pages from their own modules instead.
 */

import Dashboard from './index.tsx';

export default Dashboard;
