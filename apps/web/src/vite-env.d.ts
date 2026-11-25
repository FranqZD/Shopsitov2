/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** DSN del proyecto de Sentry para la web; vacío = sin Sentry. */
  readonly VITE_SENTRY_DSN?: string
  /** dev o prod; lo pone infra/desplegar.sh al hacer build. */
  readonly VITE_AMBIENTE?: string
}
