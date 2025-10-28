/*
 Lógica de progreso por carga horaria y estado.
 Estados y ponderaciones:
 - no cursada: 0
 - cursando: 0.25
 - cursada aprobada: 0.75
 - final aprobado / equivalencia: 1

 Valor materia = cargaHoraria (horas) -> se usa directamente como "puntos".
 Progreso % = (puntosActuales / puntosTotales) * 100

 Guardado en localStorage con clave 'studentProgressDemo'
*/

const STORAGE_KEY = 'studentProgressDemo'

const DEFAULT_SUBJECTS = [
  {id: 's1', name: 'Programación I', hours: 80, state: 'final'},
  {id: 's2', name: 'Matemática', hours: 60, state: 'cursada'},
  {id: 's3', name: 'Arquitectura de Computadoras', hours: 48, state: 'no'},
  {id: 's4', name: 'Sistemas Operativos', hours: 64, state: 'no'},
  {id: 's5', name: 'Base de Datos', hours: 72, state: 'cursando'},
  {id: 's6', name: 'Análisis de Sistemas', hours: 90, state: 'cursada'}
]

const STATE_WEIGHT = {
  'no': 0,
  'cursando': 0.25,
  'cursada': 0.75,
  'final': 1,
  'equivalencia': 1
}

let subjects = []
let carreraNombre = null
const subtitleEl = document.querySelector('.subtitle')
const defaultSubtitle = subtitleEl ? subtitleEl.textContent : ''

// Set the displayed name of the career (subtitle) and keep it in memory.
// Accepts null/undefined to reset to the default subtitle.
function setCarreraNombre(n){
  carreraNombre = n || null
  if (subtitleEl) subtitleEl.textContent = carreraNombre || defaultSubtitle
}

// elementos DOM
const subjectsContainer = document.getElementById('subjectsContainer')
const yearTabs = document.getElementById('yearTabs')

const SELECTED_YEAR_KEY = 'selectedYear'
let selectedYear = localStorage.getItem(SELECTED_YEAR_KEY) || null
const progressBar = document.getElementById('progressBar')
const percentageLabel = document.getElementById('percentage')
const pointsLabel = document.getElementById('points')
const climberG = document.getElementById('climberG')
const mountain = document.getElementById('mountain')
const mountainSVG = document.getElementById('mountainSVG')
const completionFlag = document.getElementById('completionFlag')
const confettiContainer = document.getElementById('confetti')
let confettiTimeout = null

// Simple confetti launcher (CSS-based)
// Creates `count` divs with random colors/positions and lets CSS animations handle the fall.
// Kept intentionally simple and dependency-free; for a more realistic effect use a
// canvas-based confetti library.
function launchConfetti(count = 30){
  if (!confettiContainer) return
  confettiContainer.innerHTML = ''
  const colors = ['#ef4444','#f59e0b','#fbbf24','#16a34a','#2b8ae2','#7c3aed']
  for (let i=0;i<count;i++){
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    const left = Math.random()*100
    el.style.left = left + '%'
    el.style.background = colors[Math.floor(Math.random()*colors.length)]
    el.style.transform = `translateY(${Math.random()*-40-10}px) rotate(${Math.random()*360}deg)`
    el.style.animationDuration = (1200 + Math.random()*800) + 'ms'
    el.style.opacity = 0.95
    confettiContainer.appendChild(el)
  }
  // remove after animation
  if (confettiTimeout) clearTimeout(confettiTimeout)
  confettiTimeout = setTimeout(()=>{ if (confettiContainer) confettiContainer.innerHTML = '' }, 2000)
}

// botones
const exportBtn = document.getElementById('exportBtn')
const importBtn = document.getElementById('importBtn')
const importFile = document.getElementById('importFile')

function setStatus(msg){
  const statusEl = document.getElementById('loadStatus')
  if (statusEl) statusEl.textContent = msg
}

/*
 load()
 - Intenta cargar automáticamente `materias_extraidas.json` mediante fetch(). Esto solo funciona
   si servís la carpeta por HTTP. Si el fetch falla (file:// o 404), cae a localStorage.
 - Acepta dos formatos de JSON:
     1) Array plano: [ {id,name,hours,state,year}, ... ]  (formato antiguo)
     2) Objeto: { nombre_carrera: '...', materias: [ ... ] } (recomendado)
 - Si hay datos en localStorage y difieren del archivo cargado, pregunta antes de sobrescribir.
 - Si no encuentra nada, usa `DEFAULT_SUBJECTS`.
*/
async function load() {
    try {
      const resp = await fetch('materias_extraidas.json', { cache: 'no-store' })
      if (resp.ok) {
        const data = await resp.json()
        // Aceptar tanto array plano como objeto con { nombre_carrera, materias }
        let loaded = null
        if (Array.isArray(data)) {
          loaded = data
        } else if (data && Array.isArray(data.materias)) {
          loaded = data.materias
          if (data.nombre_carrera) setCarreraNombre(data.nombre_carrera)
        }
        if (loaded) {
          const existingRaw = localStorage.getItem(STORAGE_KEY)
          if (existingRaw) {
            try {
              const existing = JSON.parse(existingRaw)
              // normalizar existing para comparar (aceptar objeto o array)
              const existingNorm = Array.isArray(existing) ? existing : (existing && Array.isArray(existing.materias) ? existing.materias : null)
              if (existingNorm && JSON.stringify(existingNorm) !== JSON.stringify(loaded)) {
                const ok = confirm('Se encontraron datos guardados localmente. Al cargar el archivo externo se sobrescribirán. ¿Desea continuar?')
                if (!ok) {
                  subjects = existingNorm || existing
                  setStatus('Se mantuvieron los datos locales (no se sobrescribió)')
                  return
                }
              }
            } catch (e) {
              // parse error: proceder a sobrescribir
            }
          }
          subjects = loaded
          save()
          setStatus('Datos cargados desde materias_extraidas.json')
          return
        }
      }
    } catch (err) {
      // Fallamos al fetch (archivo no existe o CORS/file://). Caeremos al localStorage.
      // Silencioso por diseño — no es un error crítico en uso local.
    }

  // Si no hay archivo local, usar localStorage
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        subjects = parsed
      } else if (parsed && Array.isArray(parsed.materias)) {
        subjects = parsed.materias
        if (parsed.nombre_carrera) setCarreraNombre(parsed.nombre_carrera)
      } else {
        // unknown format: ignore and fall back
      }
      setStatus('Datos cargados desde localStorage')
      return
    } catch (e) {
      // invalid storage, usar defaults
    }
  }

  // Finalmente, usar los valores por defecto embebidos
  subjects = DEFAULT_SUBJECTS
  setStatus('Usando valores por defecto')
}

function save() {
  // Guardar materias junto con el nombre de la carrera (si está disponible)
  // Guardamos un objeto con dos propiedades para preservar metadatos (nombre_carrera)
  // Esto facilita restaurar el subtítulo al recargar la página.
  const payload = {
    nombre_carrera: carreraNombre || null,
    materias: subjects
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

function calcTotals() {
  // totalPoints: suma de horas de todas las materias (base para el %)
  const totalPoints = subjects.reduce((s, x) => s + x.hours, 0)
  // actualPoints: horas ponderadas por el estado de cada materia (0,0.25,0.75,1)
  const actualPoints = subjects.reduce((s, x) => s + x.hours * (STATE_WEIGHT[x.state] || 0), 0)
  // porcentaje = (actual / total) * 100, con protección contra división por cero
  const pct = totalPoints === 0 ? 0 : (actualPoints / totalPoints) * 100
  return { totalPoints, actualPoints, pct }
}

function renderTabs(years){
  yearTabs.innerHTML = ''
  for (const y of years){
    const b = document.createElement('button')
    b.type = 'button'
    b.className = (String(y) === String(selectedYear)) ? 'active' : ''
    b.textContent = `Año ${y}`
    b.addEventListener('click', ()=>{
      selectedYear = String(y)
      localStorage.setItem(SELECTED_YEAR_KEY, selectedYear)
      renderTabs(years)
      renderSubjects()
    })
    yearTabs.appendChild(b)
  }
}

function renderSubjects() {
  subjectsContainer.innerHTML = ''
  const byYear = subjects.reduce((acc, s) => {
    (acc[s.year] = acc[s.year] || []).push(s)
    return acc
  }, {})
  const years = Object.keys(byYear).sort((a,b)=>a-b)
  // establecer año seleccionado por defecto si no hay
  if (!selectedYear && years.length>0) selectedYear = String(years[0])
  // render tabs
  renderTabs(years)

  // mostrar solo el año seleccionado
  const y = selectedYear
  const list = byYear[y] || []
  const sect = document.createElement('div')
  sect.className = 'year-section'
  const totalHours = list.reduce((s,i)=>s + (i.hours||0), 0)
  const title = document.createElement('div')
  title.className = 'year-title'
  title.innerHTML = `<strong>Año ${y}</strong><small>${list.length} materias — ${totalHours} h</small>`
  sect.appendChild(title)

  const listDiv = document.createElement('div')
  listDiv.className = 'year-list'
  for (const sub of list){
    const row = document.createElement('div')
    row.className = 'sub-row'
    const colName = document.createElement('div')
    colName.className = 'col-name'
    colName.textContent = sub.name
    const colHours = document.createElement('div')
    colHours.className = 'col-hours'
    colHours.textContent = sub.hours + ' h'
    const colState = document.createElement('div')
    colState.className = 'col-state'
    const sel = document.createElement('select')
    for (const k of Object.keys(STATE_WEIGHT)){
      const opt = document.createElement('option')
      opt.value = k
      opt.textContent = stateLabel(k)
      if (k === sub.state) opt.selected = true
      sel.appendChild(opt)
    }
    sel.addEventListener('change', (e)=>{
      sub.state = e.target.value
      save()
      updateAll()
    })
    colState.appendChild(sel)
    const colValue = document.createElement('div')
    colValue.className = 'col-value'
    colValue.textContent = `${Math.round(sub.hours * (STATE_WEIGHT[sub.state] || 0))} pts`

    row.appendChild(colName)
    row.appendChild(colHours)
    row.appendChild(colState)
    row.appendChild(colValue)
    listDiv.appendChild(row)
  }
  sect.appendChild(listDiv)
  subjectsContainer.appendChild(sect)
}

function stateLabel(k){
  switch(k){
    case 'no': return 'No cursada'
    case 'cursando': return 'Cursando'
    case 'cursada': return 'Cursada aprobada'
    case 'final': return 'Final aprobada'
    case 'equivalencia': return 'Equivalencia'
    default: return k
  }
}

function updateAll(){
  renderSubjects()
  const {totalPoints, actualPoints, pct} = calcTotals()
  progressBar.style.width = pct + '%'
  percentageLabel.textContent = `${pct.toFixed(1)}%`
  pointsLabel.textContent = `${Math.round(actualPoints)} / ${Math.round(totalPoints)} puntos`
  moveClimberToPercent(pct)
  // show completion flag when percentage reaches 100%
  try {
    if (completionFlag) {
      if (Math.round(pct) >= 100) {
        const wasVisible = completionFlag.classList.contains('visible')
        completionFlag.classList.add('visible')
        completionFlag.setAttribute('aria-hidden', 'false')
        // launch confetti only when becoming visible
        if (!wasVisible) launchConfetti(36)
      } else {
        completionFlag.classList.remove('visible')
        completionFlag.setAttribute('aria-hidden', 'true')
        if (confettiContainer) confettiContainer.innerHTML = ''
      }
    }
  } catch (e) {
    // ignore
  }
}

function moveClimberToPercent(pct){
  /*
   moveClimberToPercent(pct)
   - Si existe un `path#trail` en el inline SVG, posiciona el grupo `#climberG` a lo largo
     del path en la longitud correspondiente al porcentaje.
   - Calcula también una tangente muestreando un punto ligeramente adelantado para rotar
     el sprite y que siga la pendiente.
   - Si no hay SVG/path, usa un fallback que posiciona el sprite verticalmente dentro
     del contenedor `.mountain`.
  */
  // If we have an inline SVG with a trail path, position the climber along that path.
  try {
    if (mountainSVG) {
      const path = mountainSVG.querySelector('#trail')
      const climber = mountainSVG.querySelector('#climberG')
      if (path && climber) {
        const total = path.getTotalLength()
        const len = Math.max(0, Math.min(total, (pct/100) * total))
        const pt = path.getPointAtLength(len)
        // compute tangent for angle: sample slightly ahead
        const delta = Math.max(1, total * 0.005)
  const ahead = path.getPointAtLength(Math.min(total, len + delta))
  let angle = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI
  // special-case: keep the climber horizontal at the very first position (pct ~= 0)
  if (pct <= 0.5) angle = 0
  // offsets to better align the climber graphic (tune if needed)
  const offsetX = 0
  const offsetY = 4
        // animate by setting transform on the group: translate then rotate around approximate anchor
        climber.setAttribute('transform', `translate(${pt.x - offsetX}, ${pt.y - offsetY}) rotate(${angle})`)
        return
      }
    }
  } catch (err) {
    console.warn('No se pudo posicionar el escalador sobre el path:', err && err.message)
  }

  // Fallback: previous vertical positioning when no SVG path available
  const mountRect = mountain.getBoundingClientRect()
  const mountHeight = mountRect.height
  const minBottom = 8
  const maxBottom = mountHeight - 64 - 24 // climber height - padding
  const newBottom = Math.round(minBottom + (pct/100) * (maxBottom - minBottom))
  // if climber is not an inline group, try to set style; otherwise set transform on group
  const domClimber = document.getElementById('climber')
  if (domClimber) {
    domClimber.style.bottom = newBottom + 'px'
    domClimber.style.transform = `translateX(-50%) rotate(${Math.min(20, pct/5)}deg)`
  } else if (climberG) {
    // move climberG vertically inside the mountain container
    climberG.setAttribute('transform', `translate(50, ${mountHeight - newBottom - 24})`)
  }
}

// Nota: la acción de "resetear" fue eliminada (botón quitado del DOM)

exportBtn.addEventListener('click', ()=>{
  // Exportar incluyendo nombre de la carrera si está disponible
  const exportObj = {
    nombre_carrera: carreraNombre || defaultSubtitle || 'Mi carrera',
    materias: subjects
  }
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], {type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'progreso.json'
  a.click()
  URL.revokeObjectURL(url)
})

// Safe attach for import controls: check DOM existence before wiring events
if (importBtn) {
  if (importFile) {
    importBtn.addEventListener('click', ()=> importFile.click())
    function applyImportedData(data){
      // aceptar tanto array plano como objeto con { nombre_carrera, materias }
      let normalized = null
      if (Array.isArray(data)) normalized = data
      else if (data && Array.isArray(data.materias)) {
        normalized = data.materias
        if (data.nombre_carrera) setCarreraNombre(data.nombre_carrera)
      } else {
        throw new Error('Formato inválido')
      }

      const existingRaw = localStorage.getItem(STORAGE_KEY)
      if (existingRaw) {
        try {
          const existing = JSON.parse(existingRaw)
          const existingNorm = Array.isArray(existing) ? existing : (existing && Array.isArray(existing.materias) ? existing.materias : null)
          if (existingNorm && JSON.stringify(existingNorm) !== JSON.stringify(normalized)) {
            const ok = confirm('Se detectaron datos guardados localmente. Al importar se sobrescribirán. ¿Desea continuar?')
            if (!ok) return
          }
        } catch (e) {
          // parse error: continuar y sobrescribir
        }
      }
      subjects = normalized
      save()
      updateAll()
      setStatus('Datos importados')
    }
    importFile.addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0]
      if (!f) return
      const fr = new FileReader()
      fr.onload = ()=>{
        try{
          const data = JSON.parse(fr.result)
          applyImportedData(data)
        }catch(err){
          alert('Archivo inválido: ' + err.message)
        }
      }
      fr.readAsText(f)
    })
  } else {
    console.warn('Elemento #importFile no encontrado en el DOM; la función de import no estará disponible.')
    importBtn.addEventListener('click', ()=> alert('Elemento de importación no disponible en esta página.'))
  }
}

// inic
(async ()=>{
  await load()
  updateAll()
})()

// Accessibility: resize handler recalculates position
window.addEventListener('resize', ()=> updateAll())

// Help modal behavior
const helpBtn = document.getElementById('helpBtn')
const helpModal = document.getElementById('helpModal')
const helpOverlay = document.getElementById('helpOverlay')
const closeHelp = document.getElementById('closeHelp')

function openHelp(){
  if (!helpModal || !helpOverlay) return
  helpOverlay.hidden = false
  helpModal.hidden = false
  // move focus into dialog
  const btn = document.getElementById('closeHelp')
  if (btn) btn.focus()
}
function closeHelpModal(){
  if (!helpModal || !helpOverlay) return
  helpModal.hidden = true
  helpOverlay.hidden = true
  if (helpBtn) helpBtn.focus()
}

if (helpBtn){
  helpBtn.addEventListener('click', ()=> openHelp())
}
if (closeHelp){
  closeHelp.addEventListener('click', ()=> closeHelpModal())
}
if (helpOverlay){
  helpOverlay.addEventListener('click', ()=> closeHelpModal())
}
window.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape') closeHelpModal()
})
