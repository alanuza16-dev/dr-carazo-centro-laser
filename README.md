# Demo Dr. Luis Diego Carazo

Demo estatico en HTML, CSS y JavaScript para presentar la experiencia ginecologica del Dr. Luis Diego Carazo.

La seccion de estetica se separo en el repositorio `jennydelgado_CentroEsteticaLaser`.

Incluye:

- Pagina publica con contenido exportado y reorganizado desde el sitio de Leadpages.
- Sistema de citas ginecologicas para pacientes.
- Panel administrador para agenda ginecologica.
- Bloqueo y liberacion de espacios disponibles.
- Cancelacion de citas.
- Persistencia demo con `localStorage`.

## Accesos demo

- Cliente: `test` / `123456`
- Administrador ginecologia: `admin1` / `123456`

## Ejecutar local

Abra `index.html` directamente en el navegador o sirva la carpeta con cualquier servidor estatico.

```bash
npx serve .
```

## Cloudflare Pages

Configuracion recomendada:

- Framework preset: `None`
- Build command: dejar vacio
- Build output directory: `/`
- Root directory: `/`

## Cloudflare Worker con Wrangler

Si el dominio esta publicado como Worker y no como Pages, use `wrangler.toml` y `worker.js`. El Worker sirve los archivos estaticos y enruta `/api/appointment-chat` al mismo handler de Huli.

Antes del primer deploy:

```bash
npx.cmd wrangler login
npx.cmd wrangler secret put HULI_API_KEY
npx.cmd wrangler secret put HULI_ORGANIZATION_ID
npx.cmd wrangler secret put HULI_DOCTOR_ID
npx.cmd wrangler secret put HULI_LOOKBACK_DAYS
npx.cmd wrangler secret put HULI_LOOKAHEAD_DAYS
```

Valores usados:

- `HULI_ORGANIZATION_ID`: `562`
- `HULI_DOCTOR_ID`: `542`
- `HULI_LOOKBACK_DAYS`: `0`
- `HULI_LOOKAHEAD_DAYS`: `14`

Deploy:

```bash
npx.cmd wrangler deploy
```

## Produccion

Para convertir este demo en producto real hace falta conectar:

- Base de datos para citas y bloqueos.
- Autenticacion real para administradores.
- Notificaciones por correo, WhatsApp o SMS.
- Reglas de disponibilidad por doctor.
- Politicas de privacidad y consentimiento de datos sensibles.

## Chatbot de citas

El boton flotante de `Citas` consulta `/api/appointment-chat`, una Cloudflare Pages Function que busca pacientes y citas en Huli antes de redactar la respuesta con OpenAI desde servidor. Configure estas variables en Cloudflare Pages:

- `HULI_API_KEY`: API key de Huli solicitada por el dueno de la organizacion.
- `HULI_ORGANIZATION_ID`: organizacion Huli usada en el header `id_organization`.
- `HULI_DOCTOR_ID`: opcional, doctor de la agenda del Dr. Carazo. El link actual usa `did=542`.
- `OPENAI_API_KEY`: clave privada de OpenAI.
- `OPENAI_MODEL`: modelo a usar, por ejemplo `gpt-5.6`.
- `HULI_LOOKBACK_DAYS`: opcional, dias hacia atras para revisar citas. Por defecto `0`.
- `HULI_LOOKAHEAD_DAYS`: opcional, dias hacia adelante para revisar citas. Por defecto `14`.

El navegador solo envia la cedula escrita por el paciente. Guiones, espacios y otros caracteres especiales se limpian antes de consultar Huli; si el dato incluye letras, el chat responde que no es una cedula valida. La busqueda de expediente y citas ocurre en servidor contra Huli. Si Huli bloquea la consulta de citas por paciente, el backend usa como respaldo las citas del doctor y valida el `idPatientFile` contra los expedientes encontrados por cedula.

### Diagnostico rapido

Para probar la conexion desde el sitio desplegado sin pasar por el chat, abra:

`/api/appointment-chat?mode=diagnostics`

Y para probar una busqueda real:

`/api/appointment-chat?mode=diagnostics&query=valor`

Ese endpoint devuelve JSON con el estado de configuracion, autenticacion con Huli, busqueda de expediente, lectura de citas y la estrategia usada (`patient-appointments` o `doctor-appointments-fallback`).
