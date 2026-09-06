# Design System - Dr. Luis Diego Carazo

## Principios

- Institucional, médico y tecnológico, sin sentirse futurista.
- Composición editorial con escenas, no secciones repetidas.
- El retrato del doctor y la tecnología Fotona son señales visuales primarias.
- El chatbot se presenta como asistente de agenda, nunca como sustituto médico.

## Paleta

- Azul noche: `#071929`
- Azul clínico: `#102b45`
- Teal médico: `#12848c`
- Magenta tenue: `#c6507f`
- Oro editorial: `#b9914c`
- Papel claro: `#f4f7f8`
- Tinta: `#132235`

Uso correcto: azul noche para escenas institucionales, teal para acción primaria, magenta como acento luminoso.  
Uso incorrecto: fondos dominados por magenta, gradientes brillantes o paletas monocromáticas.

## Tipografía

- Display: Georgia/Iowan style para titulares editoriales.
- UI/body: Inter/system sans para interfaz y lectura.
- Datos técnicos: monospace del sistema.
- H1 desktop: `clamp(52px, 7vw, 96px)`.
- H2 desktop: `clamp(34px, 5vw, 70px)`.

## Espaciado y Grid

- Grid desktop: 12 columnas con márgenes fluidos.
- Escenas amplias: 100vh hero, 58vh CTA final.
- Secciones compactas: autoridad y datos.
- Móvil: composiciones rediseñadas en una columna, no solo apiladas.

## Radios, Bordes y Sombras

- Radio pequeño: `6px`.
- Radio medio: `10px`.
- Radio amplio: `18px` solo para piezas editoriales.
- Bordes luminosos sutiles: `rgba(..., .16-.26)`.
- Sombras suaves para paneles; profundidad por capas antes que sombras fuertes.

## Botones

- Primario: teal sólido con flecha direccional.
- Secundario oscuro: transparente con borde refinado.
- Texto: línea animada.
- No usar botones píldora para todas las acciones.

## Formularios y Chatbot

- Inputs con borde sobrio, foco claro y copy no técnico.
- Sofi cerrado: botón flotante premium, pulso mínimo.
- Sofi abierto: panel lateral en desktop y casi pantalla completa en móvil.
- Estados visibles: loading, error, privacidad y fallback a Huli.

## Movimiento

- Reveal escalonado con `IntersectionObserver`.
- Hover de 2 a 4 px.
- Header se contrae al hacer scroll.
- Respetar `prefers-reduced-motion`.

## Imágenes

- Retrato vertical del doctor: busto, fondo sobrio, luz clínica.
- Tecnología Fotona: imagen horizontal con espacio para datos superpuestos.
- Evitar stock médico obvio cuando haya foto real disponible.

## Accesibilidad

- Botones reales para acciones.
- `aria-live` en el chat y selector.
- Navegación móvil con `aria-expanded`.
- Contraste alto en escenas oscuras.
