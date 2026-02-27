import { defineConfig } from 'vitest/config';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [
    {
      name: 'angular-template-loader',
      transform(code, id) {
        if (id.endsWith('.component.ts')) {
          let newCode = code.replace(/templateUrl:\s*['"]([^'"]+)['"]/g, (match, p1) => {
            const templatePath = path.resolve(path.dirname(id), p1);
            if (fs.existsSync(templatePath)) {
              const templateContent = fs.readFileSync(templatePath, 'utf-8');
              const escapedTemplate = templateContent
                .replace(/\\/g, '\\\\')
                .replace(/`/g, '\\`')
                .replace(/\$/g, '\\$');
              return `template: \`${escapedTemplate}\``;
            }
            return match;
          });
          
          newCode = newCode.replace(/styleUrls:\s*\[\s*['"]([^'"]+)['"]\s*\]/g, (match, p1) => {
            const stylePath = path.resolve(path.dirname(id), p1);
            if (fs.existsSync(stylePath)) {
              const styleContent = fs.readFileSync(stylePath, 'utf-8');
              const escapedStyle = styleContent
                .replace(/\\/g, '\\\\')
                .replace(/`/g, '\\`')
                .replace(/\$/g, '\\$');
              return `styles: [\`${escapedStyle}\`]`;
            }
            return match;
          });
          
          return { code: newCode, map: null };
        }
      }
    }
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setup-vitest.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/types/**']
    },
    testTimeout: 10000
  }
});