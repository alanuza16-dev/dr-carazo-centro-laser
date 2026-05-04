# Demo Dr. Luis Diego Carazo / Centro LASER

Demo estatico en HTML, CSS y JavaScript para presentar dos areas de atencion:

- Ginecologia: Dr. Luis Diego Carazo.
- Estetica LASER: esteticista profesional FOTONA.

Incluye:

- Pagina publica con contenido exportado y reorganizado desde el sitio de Leadpages.
- Sistema de citas para pacientes.
- Panel administrador separado por area.
- Bloqueo y liberacion de espacios disponibles.
- Cancelacion de citas.
- Persistencia demo con `localStorage`.

## Accesos demo

- Ginecologia: `carazo2026`
- Estetica: `laser2026`

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

## Produccion

Para convertir este demo en producto real hace falta conectar:

- Base de datos para citas y bloqueos.
- Autenticacion real para administradores.
- Notificaciones por correo, WhatsApp o SMS.
- Reglas de disponibilidad por doctor.
- Politicas de privacidad y consentimiento de datos sensibles.
