import fs from 'fs/promises';
import { defineConfig } from 'vite';

export default defineConfig({
  // ...
  plugins: [
    // ...
    {
      name: 'index-html-env',
      async transformIndexHtml() {
        if (process.env.NODE_ENV !== 'production') {
          return await fs.readFile('driver.html', 'utf8')
        }
      }
    },
  ],
  // ...
});