# Dr. Luis Diego Carazo

Sitio médico estático servido por Cloudflare Workers. La agenda real vive en Huli y Sofi conversa con pacientes desde un único chat.

## Flujo productivo

- Páginas públicas: `index.html`, `ginecologia.html`, `faq.html`, `articulos.html`.
- Agenda nueva: enlace directo al calendario oficial Huli del doctor.
- Revisión de cita: Sofi verifica cédula y correo o teléfono del expediente antes de consultar citas en Huli.
- Disponibilidad: Sofi pregunta el día deseado (por ejemplo, "8 de octubre") y consulta las dos sedes solo para esa fecha. También puede mostrar los próximos espacios en ventanas de siete días.
- Reserva: Sofi solicita nombre, cédula, teléfono y correo; vuelve a comprobar el espacio y crea expediente/cita en Huli tras la confirmación explícita.
- Información general: respuestas frecuentes aprobadas sin OpenAI. Solo preguntas informativas largas utilizan `gpt-5.4-nano`, con salida limitada a 140 tokens y sin datos de pacientes.
- Páginas internas heredadas (`agenda.html`, `login.html`, `admin.html`, `citas.html`) quedaron como referencias operativas sin agenda local ni usuarios locales.

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
- `OPENAI_MODEL`: `gpt-5.4-nano`
- `ENABLE_DIAGNOSTICS`: usar `true` solo temporalmente para pruebas.

## Diagnóstico Huli

El diagnóstico está protegido. Use una de estas opciones:

- Definir `ENABLE_DIAGNOSTICS=true` temporalmente.
- Definir `DIAGNOSTICS_TOKEN` y llamar `/api/appointment-chat?mode=diagnostics&token=TOKEN&query=CEDULA`.

La respuesta nunca debe mostrar el API key, JWT ni cédula completa.

## Desarrollo

```bash
npx.cmd wrangler dev
```

Validación rápida:

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
