# Visualizador de Progreso Académico — "Escalando la Montaña"

Carlos Ignacio Guariglia — 2025

"No se trata de llegar primero, sino de no dejar de subir."

## Resumen

Demo estática que visualiza el progreso académico como un personaje que escala una montaña. Cada materia aporta puntos equivalentes a su carga horaria y un estado (no cursada, cursando, cursada aprobada, final/equivalencia) determina qué fracción de esos puntos cuenta para el progreso total.

## Stack

- HTML, CSS, JavaScript (vanilla)
- Visual: SVG inline + imágenes en `assets/`
- Persistencia: `localStorage`

## Estructura del proyecto

- `index.html` — Interfaz principal (SVG montaña, contenedores, modal de ayuda, bandera de finalización).
- `styles.css` — Estilos y responsividad.
- `app.js` — Lógica: carga/guardado, cálculo, renderizado, movimiento del escalador, confetti y UI helpers.
- `*.json` — Archivos JSON con materias (puedes importar/exportar desde la UI).
- `assets/` — Imágenes utilizadas.

## Ejecutar localmente

Recomendado: servir por HTTP para que `fetch()` pueda cargar archivos como `materias_extraidas.json`.

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Importar / Exportar

- Usa el botón "Importar JSON" para seleccionar un archivo con la malla/carrera.
- El formato recomendado es un objeto con metadatos y la lista de materias:

```json
{
  "nombre_carrera": "Tecnicatura Analista de Sistemas - ISFT 151",
  "materias": [
    {"id":"s1","name":"Programación I","hours":80,"state":"final","year":1},
    {"id":"s2","name":"Matemática","hours":60,"state":"cursada","year":1}
  ]
}
```

- La app también acepta el formato antiguo (array plano de materias) por compatibilidad.
- Al exportar, la app guardará un objeto `{ nombre_carrera, materias }` para preservar el título de la carrera.

## UI importantes

- **Importar JSON**: selecciona un archivo y lo carga en la app (te pedirá confirmación si existen datos locales distintos).
- **Exportar JSON**: descarga un archivo JSON con `{ nombre_carrera, materias }` que preserva tu progreso y el nombre de la carrera.
- **Botón "?"**: abre un modal de ayuda con las instrucciones y la tabla de porcentajes.
- **Bandera / Confetti**: al alcanzar 100% aparece el cartel de felicitaciones y se lanza confetti.

## Notas técnicas (resumen)

- `load()` — intenta `fetch('materias_extraidas.json')` en la raíz (si sirve por HTTP). Si no, carga desde `localStorage`. Si no hay datos, usa valores por defecto.
- `save()` — guarda en `localStorage` un objeto `{ nombre_carrera, materias }` para conservar el nombre de la carrera.
- `calcTotals()` — suma `hours` para `totalPoints` y calcula `actualPoints` usando los pesos definidos en `STATE_WEIGHT`.
- `moveClimberToPercent(pct)` — si existe un inline SVG con `path#trail`, calcula la posición sobre el path (getTotalLength/getPointAtLength) y rota el grupo `#climberG` según la tangente para que el escalador siga la pendiente.
- `renderSubjects()` — agrupa por `year` y crea filas con `select` para cambiar estado; cada cambio guarda y recalcula.

## Cambios recientes

- Subtítulo dinámico: si el JSON importado contiene `nombre_carrera`, se mostrará en el `.subtitle` y se guarda en `localStorage`.
- Botón de ayuda `?` junto a "Materias" que abre un modal con instrucciones.
- Bandera de finalización centrada en la montaña: aparece al alcanzar 100% y dispara confetti.
- Eliminado el botón "Resetear datos" (la acción peligrosa se quitó de la UI). Si querés, puedo añadir un mecanismo de backup/deshacer antes de importar.

## Consejos de ajuste

- Ajustar sprite: en `index.html` dentro de `<g id="climberG">` puedes editar los atributos `x`, `y`, `width`, `height` del `<image>`.
- Afinar colocación: en `app.js` modifica `offsetX` / `offsetY` dentro de `moveClimberToPercent`.
- Si `fetch()` no carga por `file://`, usa el botón Importar (funciona siempre).

## Depuración rápida

- Ver errores en DevTools → Console.
- Si el escalador no aparece, revisa que `assets/estudiante3.png` exista y que la referencia en `index.html` sea correcta.

## Ideas de mejoras

- Validación/Schema al importar JSON.
- Modal custom para confirmaciones en lugar de `confirm()`.
- Implementar confetti en canvas para más realismo.

## Contacto

Si querés que implemente alguna mejora (canvas confetti, selector de carrera persistente, tests), decímelo y lo hago.

## Licencia

Uso personal/educativo. Si vas a publicar o distribuir, revisá las licencias de las imágenes.
