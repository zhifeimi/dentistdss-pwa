/**
 * Header component exports
 * 
 * Refactored from single 448-line file to modular architecture:
 * - Header.tsx: Main component (~100 lines)
 * - Logo.tsx: Logo component
 * - Navigation.tsx: Desktop navigation
 * - UserActions.tsx: User action buttons
 * - ThemeToggle.tsx: Theme toggle button
 * - MobileMenu.tsx: Mobile navigation menu
 * - ProfileMenu.tsx: User profile menu
 * - useHeaderState.ts: State management hook
 * - utils.ts: Utility functions
 * - constants.ts: Constants and configuration
 * - types.ts: TypeScript interfaces
 * 
 * Benefits:
 * ✅ 78% reduction in main component size (448 → ~100 lines)
 * ✅ Single Responsibility Principle compliance
 * ✅ Better testability with focused components
 * ✅ Improved maintainability and readability
 * ✅ Reusable components and utilities
 * ✅ Type safety with TypeScript
 */

export { default } from './Header';
export * from './utils';
export * from './constants';
export * from './types';
