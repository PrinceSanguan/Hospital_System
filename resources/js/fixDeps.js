/**
 * This file is used to ensure Vite properly pre-optimizes React dependencies
 * Import this file at the top of your app.tsx to ensure dependencies are loaded
 */

// Eagerly import dependencies to ensure they're optimized
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import * as InertiaCore from '@inertiajs/core';
import * as InertiaReact from '@inertiajs/react';

// Explicitly export them to prevent tree-shaking
export const deps = {
  React,
  ReactDOM,
  InertiaCore,
  InertiaReact
};

// Force load dependencies
console.debug('Dependencies loaded for optimization', Object.keys(deps));

// No-op function to ensure this file is always imported
export function ensureDepsLoaded() {
  return true;
} 