# Design System - Dr. Luis Diego Carazo

## Principios

- Institucional, medico y tecnologico, sin sentirse futurista.
- Composicion editorial con escenas, no secciones repetidas.
- El retrato del doctor y la tecnologia Fotona son senales visuales primarias.
- El chatbot se presenta como asistente de agenda, nunca como sustituto medico.

## Paleta

- Azul noche: `#071929`
- Azul clinico: `#102b45`
- Teal medico: `#12848c`
- Magenta tenue: `#c6507f`
- Oro editorial: `#b9914c`
- Papel claro: `#f4f7f8`
- Tinta: `#132235`

Uso correcto: azul noche para escenas institucionales, teal para accion primaria, magenta como acento luminoso.  
Uso incorrecto: fondos dominados por magenta, gradientes brillantes o paletas monocromaticas.

## Tipografia

- Display: Georgia/Iowan style para titulares editoriales.
- UI/body: Inter/system sans para interfaz y lectura.
- Datos tecnicos: monospace del sistema.
- H1 desktop: `clamp(52px, 7vw, 96px)`.
- H2 desktop: `clamp(34px, 5vw, 70px)`.

## Espaciado y Grid

- Grid desktop: 12 columnas con margenes fluidos.
- Escenas amplias: 100vh hero, 58vh CTA final.
- Secciones compactas: autoridad y datos.
- Movil: composiciones redisenadas en una columna, no solo apiladas.

## Radios, Bordes y Sombras

- Radio pequeno: `6px`.
- Radio medio: `10px`.
- Radio amplio: `18px` solo para piezas editoriales.
- Bordes luminosos sutiles: `rgba(..., .16-.26)`.
- Sombras suaves para paneles; profundidad por capas antes que sombras fuertes.

## Botones

- Primario: teal solido con flecha direccional.
- Secundario oscuro: transparente con borde refinado.
- Texto: linea animada.
- No usar botones pildora para todas las acciones.

## Formularios y Chatbot

- Inputs con borde sobrio, foco claro y copy no tecnico.
- Sofi cerrado: boton flotante premium, pulso minimo.
- Sofi abierto: panel lateral en desktop y casi pantalla completa en movil.
- Estados visibles: loading, error, privacidad y fallback a Huli.

## Movimiento

- Reveal escalonado con `IntersectionObserver`.
- Hover de 2 a 4 px.
- Header se contrae al hacer scroll.
- Respetar `prefers-reduced-motion`.

## Imagenes

- Retrato vertical del doctor: busto, fondo sobrio, luz clinica.
- Tecnologia Fotona: imagen horizontal con espacio para datos superpuestos.
- Evitar stock medico obvio cuando haya foto real disponible.

## Accesibilidad

- Botones reales para acciones.
- `aria-live` en el chat y selector.
- Navegacion movil con `aria-expanded`.
- Contraste alto en escenas oscuras.
