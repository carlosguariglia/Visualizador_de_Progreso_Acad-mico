Proyecto: Visualizador de Progreso Académico — "Escalando la Montaña"
=====================================================

Carlos Ignacio Guariglia
2025



"No se trata de llegar primero, sino de no dejar de subir."




Resumen
-------
Esta es una demo/pequeña app estática que visualiza el progreso académico de un estudiante como un personaje que escala una montaña. Cada materia tiene una carga horaria (puntos) y un estado (no cursada, cursando, cursada aprobada, final/equivalencia) que aporta una fracción de esos puntos al progreso total.

Stack
-----
- HTML, CSS, JavaScript (vanilla)
- Visual: SVG inline + imágenes en `assets/`
- Persistencia: `localStorage`

Estructura del proyecto
-----------------------
- `index.html` — Interfaz principal. Contiene el SVG de la montaña (`#mountainSVG`), el `path` del sendero (`#trail`) y el `g#climberG` que contiene el sprite del personaje.
- `styles.css` — Estilos para layout, versión compacta para desktop y responsive para móviles.
- `app.js` — Lógica principal: carga/guardado de materias, cálculo de puntos y porcentaje, renderizado de la UI y posicionamiento del climber sobre el `#trail`.
- `materias_extraidas.json` — (opcional) malla cargable automáticamente si sirves el proyecto por HTTP.
- `assets/` — Contiene imágenes SVG/PNG usadas (montaña, personaje).

Cómo ejecutar (desarrollo)
--------------------------
1. Abre una terminal en la raíz del proyecto.
2. Sirve por HTTP (recomendado para fetch/autocarga):

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

3. Interactúa con la UI: cambia estados de materia, exporta/importa JSON, etc.

Qué hace `app.js` (explicación por partes)
-----------------------------------------
- Carga de datos (función `load()`):
  - Intenta `fetch('materias_extraidas.json')` (funciona sólo si sirves por HTTP).
  - Si hay datos en `localStorage`, los usa y evita sobrescribirlos sin confirmación.
  - Si no hay nada, usa `DEFAULT_SUBJECTS` embebidos.
  - `setStatus(msg)` centraliza el texto de estado visible a la derecha del progreso.

- Cálculo de progreso (`calcTotals()`):
  - Suma `hours` de todas las materias y calcula los "puntos actuales" aplicando los pesos para cada estado (0/0.25/0.75/1).
  - Devuelve totalPoints, actualPoints y pct (porcentaje).

- UI dinámica (`renderTabs()` y `renderSubjects()`):
  - Agrupa materias por `year` (si están presentes) y renderiza pestañas por año.
  - Para cada materia crea un `select` que permite cambiar el estado; al cambiar se guarda en `localStorage` y se recalcula todo.

- Movimiento del personaje (`moveClimberToPercent(pct)`):
  - Busca un `path#trail` dentro del inline SVG `#mountainSVG`.
  - Convierte `pct` a una longitud sobre el path: `len = pct/100 * path.getTotalLength()`.
  - Obtiene el punto con `path.getPointAtLength(len)` y un punto cercano para derivar la tangente y así calcular el ángulo con `atan2`.
  - Aplica `transform=\"translate(x,y) rotate(angle)\"` sobre el grupo `#climberG`.
  - Comportamiento especial: cuando `pct <= 0.5` el personaje queda horizontal (ángulo = 0).
  - Fallback: si `#mountainSVG` o `#trail` no existen, existe una lógica de posicionamiento vertical basada en `mount.getBoundingClientRect()`.

Decisiones y por qué
--------------------
- SVG inline: facilita usar `getTotalLength()` y `getPointAtLength()` para posicionar el personaje con precisión sobre el sendero.
- `localStorage`: simple y suficiente para una demo sin backend.
- Peso por estado: ofrece una forma de reflejar progreso parcial (cursando, cursada) sin requerir estados numéricos más complejos.

Ajustes finos que puedes hacer
------------------------------
- Ajustar la posición del sprite:
  - En `index.html` dentro de `<g id=\"climberG\">` edita el `<image>` atributos `x`, `y`, `width`, `height` para escalar/recolocar.
  - En `app.js` ajustar `offsetX` / `offsetY` dentro de `moveClimberToPercent` para afinar la colocación sobre el path.
- Cambiar último punto del `path#trail` si la punta de tu imagen de montaña está en otra posición.
- Cambiar el umbral que fija la horizontalidad inicial (ahora `pct <= 0.5`) si quieres otra respuesta.

Buenas prácticas y siguientes mejoras
------------------------------------
- Reemplazar `confirm()` por un modal custom para mejor UX.
- Añadir validación de formato al importar (esquema JSON).
- Persistencia avanzada: usar IndexedDB o un backend si quieres sincronizar entre dispositivos.
- Tests: añadir un pequeño test para `calcTotals()` y para el cálculo de coordenadas del path (mockear path.getTotalLength/getPointAtLength).

Comprobaciones rápidas (sanity checks)
--------------------------------------
- Si el personaje no aparece:
  - Asegúrate de que `assets/estudiante2.png` existe o que `#climberImg` referencia la ruta correcta.
  - Abre DevTools → Console y Network para ver errores 404 o excepciones.
- Si el personaje no se alinea con la punta:
  - Ajusta el último segmento del `path#trail` o cambia `offsetY` en `app.js`.

Contacto y siguientes pasos
--------------------------
Si querés que:
- ajuste la trayectoria para que coincida exactamente con la punta, subí una captura donde se vea el desajuste y lo afino (ajuste X/Y),
- haga la importación dinámica (crear input desde JS) para garantizar funcionamiento en todas las páginas,
- añada tests y un script `npm test` minimal,
hazme saber y lo implemento.

Licencia
--------
Contenido del proyecto: libre uso personal/educativo. Si vas a publicar o distribuir, verifica las licencias de las imágenes usadas.
