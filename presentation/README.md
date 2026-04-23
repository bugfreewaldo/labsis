# Presentación · Labsis MVP (React + Framer Motion)

Deck interactivo para la defensa del Proyecto Final 1MW211 (25 min, 18 slides).
Versión React de las mismas slides del PPTX, con transiciones, reveladas
escalonadas, typewriter en la demo, contadores animados y fondo ambiental
"vivo".

## Arrancar

```bash
# desde labsis-mvp/presentation/
npm install
npm run dev
# → http://localhost:3010
```

Luego **F** para pantalla completa, **→** para avanzar.

## Atajos

| Tecla | Acción |
|---|---|
| `→` / `Espacio` / `PageDown` | Siguiente slide |
| `←` / `PageUp` | Anterior |
| `Home` / `End` | Primera / última |
| `F` | Pantalla completa |
| `N` | Toggle notas del presentador |
| `?` | Ayuda |
| `#5` en la URL | Salta a la slide 5 |

## Estructura

```
presentation/
├── app/
│   ├── page.tsx          # punto de entrada
│   ├── slides.tsx        # las 18 slides
│   ├── layout.tsx        # html shell
│   └── globals.css       # Tailwind + estilos slide
├── components/
│   ├── Deck.tsx          # shell: nav, progress, aurora BG, help
│   └── Slide.tsx         # primitivas: Slide, Bullets, Figure, Stat, Typewriter, AmbientBG
├── public/diagrams/      # PNGs del informe
├── package.json
└── tailwind.config.ts
```

## Producción (standalone)

```bash
npm run build
npm run start
# o con Docker
docker build -t labsis-presentation .
docker run --rm -p 3010:3010 labsis-presentation
```

## Notas del presentador

Cada slide tiene notas que sólo ves tú; pulsa **N** mientras expones.
Abrelo en una segunda pantalla en modo pestaña y la audiencia ve la principal.

## Tips para la defensa

1. **Fullscreen** (F) apenas entres a la sala. La barra del navegador estorba.
2. Abre la slide 14 (Demo) y al llegar **pasa al terminal** con `make demo` en
   una segunda pantalla. La slide queda como ancla visual.
3. Si olvidas qué toca: pulsa **N** y lee tus notas sin romper la continuidad.
4. La URL con hash (`http://localhost:3010/#7`) deja la slide 7 cargada
   directo; útil si cae el navegador a media defensa.
