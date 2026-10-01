import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const agoraAppId =
    process.env.VITE_AGORA_APP_ID ||
    process.env.AGORA_APP_ID ||
    env.VITE_AGORA_APP_ID ||
    env.AGORA_APP_ID ||
    '';
  const agoraToken =
    process.env.VITE_AGORA_TOKEN ||
    env.VITE_AGORA_TOKEN ||
    '';
  const agoraCert =
    process.env.VITE_AGORA_APP_CERTIFICATE ||
    process.env.AGORA_APP_CERTIFICATE ||
    env.VITE_AGORA_APP_CERTIFICATE ||
    env.AGORA_APP_CERTIFICATE ||
    '';

  const cleanAppId = agoraAppId.trim().replace(/^["']|["']$/g, '');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_AGORA_APP_ID': JSON.stringify(cleanAppId),
      'import.meta.env.VITE_AGORA_TOKEN': JSON.stringify(agoraToken.trim().replace(/^["']|["']$/g, '')),
      'import.meta.env.VITE_AGORA_APP_CERTIFICATE': JSON.stringify(agoraCert.trim().replace(/^["']|["']$/g, '')),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
