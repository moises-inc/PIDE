# AGENTS.md (OpenCode Environment — PIDE)

Este archivo configura las reglas de comportamiento, la autodeclaración de habilidades y las directrices de prevención de desbordamiento de tokens para el agente **OpenCode** en el espacio de trabajo **PIDE (Periodic Information and Data Explorer)**.

---

## 🧭 Misión del Proyecto PIDE
Construir una suite científica local, interactiva y de código abierto para la exploración, análisis cuantitativo, espectroscopía atómica y modelado 3D de los elementos químicos de la Tabla Periódica.
* **Hermano de NIDE:** Sigue la misma excelencia técnica, determinismo y trazabilidad.
* **Sin Nube ni LLMs en runtime:** 100% determinista, reproducible y rápido.
* **Física y Química Validada:** Validado contra estándares de IUPAC/CIAAW 2021, NIST ASD y CRC Handbook.

---

## 🛠️ Descubrimiento de Habilidades (Agent Skills)
El sistema cuenta con el paquete de habilidades de desarrollo de software `agent-skills` instalado globalmente en:
`/home/moises/.gemini/config/plugins/agent-skills/skills/`

### Reglas Críticas de Selección:
1. **Analizar la Intención:** Antes de realizar cualquier acción, comprueba si la solicitud mapea con alguna de las 24 habilidades (e.g. `frontend-ui-engineering`, `api-and-interface-design`, `test-driven-development`, `observability-and-instrumentation`).
2. **Ejecutar la Habilidad:** Sigue el ciclo de diseño (especificación, planificación, tests TDD, implementación y revisión).
3. **Prohibido Implementar Directamente:** No saltes directamente a escribir código o realizar cambios sin antes haber completado las fases de diseño y planificación indicadas por la habilidad.

---

## 🌐 Navegación y Automatización Web Eficiente (Playwright)
* **Priorizar `playwright-cli`:** Para ahorrar ventana de contexto, evita usar el servidor MCP si la tarea puede realizarse de forma secuencial con `playwright-cli` desde la terminal.
* Comandos clave:
  * Iniciar: `playwright-cli open "http://localhost:5173"`
  * Captura en disco: `playwright-cli screenshot "/tmp/pide_test.png"`
  * Cerrar: `playwright-cli close`

---

## 📋 Sincronización con Antigravity 2.0
* Al completar cualquier hito o tarea táctica, genera una bitácora en `/mnt/9b846436-0407-4e80-b8af-5417ffbdee8e/ObsidianVault/90_System/Agent_Sync/Task_Logs/log_pide_<fase>.md` con `requires_orchestration: true` y el enlace `🔗 [[Task_Board]]`.
