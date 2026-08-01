# Dr. Luis Diego Carazo

Sitio medico estatico servido por Cloudflare Workers. La agenda real vive en Huli y el chatbot escrito `Sofi` consulta Huli desde servidor cuando la paciente ingresa una cedula.

## Flujo productivo

- Paginas publicas: `index.html`, `ginecologia.html`, `faq.html`, `articulos.html`.
- Agenda nueva: enlace directo al calendario oficial Huli del doctor.
- Revision de cita: `POST /api/appointment-chat` obtiene JWT de Huli y busca expediente/citas en la misma ejecucion.
- Informacion general: Sofi responde solo con contenido aprobado del sitio.
- Paginas demo antiguas (`agenda.html`, `login.html`, `admin.html`, `citas.html`) quedaron como handoff, sin localStorage ni usuarios demo.

## Variables y secretos

Crear `.dev.vars` localmente o cargar secretos en Cloudflare con `wrangler secret put`. No commitear valores reales.

```bash
npx.cmd wrangler secret put HULI_API_KEY
npx.cmd wrangler secret put HULI_ORGANIZATION_ID
npx.cmd wrangler secret put HULI_DOCTOR_ID
npx.cmd wrangler secret put OPENAI_API_KEY
npx.cmd wrangler secret put DIAGNOSTICS_TOKEN
```

Variables no sensibles recomendadas:

- `HULI_ORGANIZATION_ID`: `562`
- `HULI_DOCTOR_ID`: `542`
- `HULI_LOOKBACK_DAYS`: `0`
- `HULI_LOOKAHEAD_DAYS`: `14`
- `OPENAI_MODEL`: `gpt-5-mini`
- `ENABLE_DIAGNOSTICS`: usar `true` solo temporalmente para pruebas.

## Diagnostico Huli

El diagnostico esta protegido. Use una de estas opciones:

- Definir `ENABLE_DIAGNOSTICS=true` temporalmente.
- Definir `DIAGNOSTICS_TOKEN` y llamar `/api/appointment-chat?mode=diagnostics&token=TOKEN&query=CEDULA`.

La respuesta nunca debe mostrar el API key, JWT ni cedula completa.

## Desarrollo

```bash
npx.cmd wrangler dev
```

Validacion rapida:

```bash
node --check app.js
node --check worker.js
node --check functions/api/appointment-chat.js
npx.cmd wrangler deploy --dry-run
```

## Deploy

```bash
npx.cmd wrangler deploy --keep-vars
```
