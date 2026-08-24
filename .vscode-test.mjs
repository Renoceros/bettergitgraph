import * as path from 'path';
import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/test/**/*.test.js',
  workspaceFolder: './test-fixtures/sample-repo',
  mocha: {
    ui: 'bdd',
    timeout: 20000,
  },
});
