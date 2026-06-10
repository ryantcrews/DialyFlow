/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_MODE?: 'marketing' | 'app';
  readonly VITE_DEPLOY_ENV?: 'development' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
