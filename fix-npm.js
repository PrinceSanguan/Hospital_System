#!/usr/bin/env node

/**
 * This script manually patches problematic dependencies for React 19
 */

const fs = require('fs');
const path = require('path');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('node_modules directory not found. Please run npm install first.');
  process.exit(1);
}

try {
  // Create a fake react-switch module that uses our custom implementation
  const switchDir = path.join('node_modules', '@radix-ui', 'react-switch');

  if (!fs.existsSync(switchDir)) {
    console.log('Creating directory:', switchDir);
    fs.mkdirSync(switchDir, { recursive: true });
  }

  // Create a fake package.json that pretends it's compatible with React 19
  const packageJson = {
    name: '@radix-ui/react-switch',
    version: '1.0.3',
    main: 'dist/index.js',
    module: 'dist/index.mjs',
    types: 'dist/index.d.ts',
    peerDependencies: {
      react: "^16.8 || ^17.0 || ^18.0 || ^19.0",
      'react-dom': "^16.8 || ^17.0 || ^18.0 || ^19.0"
    }
  };

  fs.writeFileSync(
    path.join(switchDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create dist directory
  const distDir = path.join(switchDir, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Create a fake index file that exports our custom Switch component
  const indexContent = `
  export * from '../../../../../resources/js/components/ui/switch-compat.js';
  `;

  fs.writeFileSync(path.join(distDir, 'index.js'), indexContent);
  fs.writeFileSync(path.join(distDir, 'index.mjs'), indexContent);

  // Create a simple type definition file
  const typesContent = `
  import * as React from 'react';

  export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
  }

  export declare const Switch: React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLInputElement>>;
  `;

  fs.writeFileSync(path.join(distDir, 'index.d.ts'), typesContent);

  console.log('React 19 compatibility patches applied successfully!');
} catch (error) {
  console.error('Error applying patches:', error);
  process.exit(1);
}
