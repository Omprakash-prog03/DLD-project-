import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const androidDownloadHeadersPlugin: Plugin = {
  name: 'android-download-headers',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url?.split('?')[0] || '';
      if (url.endsWith('.apk')) {
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        const filename = url.split('/').pop() || 'smart-clock-release.apk';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      } else if (url.endsWith('.aab')) {
        res.setHeader('Content-Type', 'application/octet-stream');
        const filename = url.split('/').pop() || 'smart-clock.aab';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url?.split('?')[0] || '';
      if (url.endsWith('.apk')) {
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        const filename = url.split('/').pop() || 'smart-clock-release.apk';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      } else if (url.endsWith('.aab')) {
        res.setHeader('Content-Type', 'application/octet-stream');
        const filename = url.split('/').pop() || 'smart-clock.aab';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      next();
    });
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), androidDownloadHeadersPlugin],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
});
