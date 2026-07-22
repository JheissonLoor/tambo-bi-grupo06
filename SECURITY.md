# Seguridad

Este repositorio contiene únicamente datos académicos sintéticos. No deben registrarse nombres, documentos, correos, teléfonos ni otra información personal de clientes reales.

## Credenciales

- El frontend solo puede usar `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Nunca se debe copiar una clave `service_role`, secret key, contraseña de base de datos o token personal dentro del código, issues, commits o variables `VITE_*`.
- `.env.local` está excluido de Git. `.env.example` contiene únicamente placeholders.

## Acceso a datos

Todas las tablas tienen Row Level Security habilitado. Los roles `anon` y `authenticated` reciben solo `SELECT` y ejecución de las RPC analíticas autorizadas. Las escrituras y el acceso a secuencias se revocan explícitamente en la migración.

Para reportar un problema de seguridad, contactar de forma privada al responsable del repositorio y evitar publicar credenciales o datos sensibles en un issue público.
