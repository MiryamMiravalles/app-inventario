// vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Aquí puedes tipar otras variables si es necesario
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
