# Seguridad

Este repositorio contiene únicamente datos académicos sintéticos. No deben registrarse nombres, documentos, correos, teléfonos ni otra información personal de clientes reales.

## Credenciales

- El frontend solo puede usar `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Nunca se debe copiar una clave `service_role`, secret key, contraseña de base de datos o token personal dentro del código, issues, commits o variables `VITE_*`.
- `.env.local` está excluido de Git. `.env.example` contiene únicamente placeholders.

## Acceso a datos

Todas las tablas tienen Row Level Security habilitado y permanecen sin políticas públicas. Los roles `anon` y `authenticated` no reciben `SELECT` directo sobre tablas ni vistas internas: solo pueden ejecutar las RPC analíticas de lectura incluidas en la lista explícita de permisos.

Las RPC públicas usan `SECURITY DEFINER` únicamente para atravesar esa frontera de lectura, fijan un `search_path` vacío y referencian objetos con esquema completo. La migración revoca `EXECUTE` por defecto y lo concede caso por caso. El endpoint de entrenamiento también consume `get_model_features()` en vez de exponer `v_model_features`.

## Navegador y despliegue

Vercel aplica CSP, protección contra framing, `nosniff`, política de referencia y bloqueo de cámara, micrófono y geolocalización. La CSP permite exclusivamente los orígenes requeridos por Supabase, las fuentes declaradas y el iframe oficial de Power BI.

Para reportar un problema de seguridad, contactar de forma privada al responsable del repositorio y evitar publicar credenciales o datos sensibles en un issue público.
