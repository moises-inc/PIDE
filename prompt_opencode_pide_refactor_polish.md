# 🚀 Prompt Táctico de Refactorización y Documentación: PIDE (Periodic Information and Data Explorer)

> **Destinatario:** OpenCode (OpenCode Desktop / OpenCode Go)
> **Workspace:** `/mnt/9b846436-0407-4e80-b8af-5417ffbdee8e/PIDE`
> **Repositorio Oficial:** `https://github.com/moises-inc/PIDE`
> **Proyecto Inspirador (Atribución):** `https://github.com/AndresSabogal00/NIDE`
> **Modelo Recomendado:** `DeepSeek V4 Pro` (para redacción de documentación técnica, física cuántica y arquitectura) / `DeepSeek V4 Flash` (para refactorización de CSS y componentes).

---

## 🎯 Objetivos de la Tarea

1. **🎨 Rediseño Visual Completo (Tema Oscuro Puro / OLED Black):**
   - Actualizar `frontend/src/index.css` reemplazando los tintes verdosos/teal por una paleta **OLED Dark** (`#000000`, `#09090b`, `#121214`), bordes en gris zinc (`#27272a`, `#3f3f46`), texto claro de alto contraste (`#fafafa`, `#a1a1aa`) y acentos de color vibrantes para los bloques químicos.
2. **🐞 Corrección de Interactividad y Botones en UI:**
   - Asegurar que el botón de añadir/quitar del comparador en `ElementDetail.tsx` permita alternar el estado fácilmente.
   - Verificar la respuesta visual inmediata de todos los botones de navegación, descarga y exportación.
3. **⚖️ Licencia MIT y Atribución a NIDE:**
   - Crear `LICENSE` con licencia MIT (Copyright 2026 Moisés Amundarain Romero & PIDE Contributors).
   - Incluir en `README.md`, `package.json`, `pyproject.toml` y en el footer de la aplicación el reconocimiento explícito y enlace a **NIDE de Andrés Sabogal (`https://github.com/AndresSabogal00/NIDE`)**.
4. **📚 Suite de Documentación CodeWiki (`docs/`):**
   - `docs/architecture.md`: Diagrama de flujo de datos, arquitectura modular FastAPI + React 19 y principios deterministas.
   - `docs/api_reference.md`: Especificación técnica de los 9 endpoints REST y la librería pública de Python `pide`.
   - `docs/quantum_crystal_engines.md`: Explicación matemática de los armónicos esféricos, polinomios de Laguerre, Marching Cubes y las 14 redes de Bravais.
   - `docs/data_pipeline.md`: Metodología de curaduría de datos de IUPAC/CIAAW, NIST ASD y CRC Handbook.
5. **📖 Guía de Uso Completa:**
   - Crear `docs/USER_GUIDE.md` y `docs/GUIA_DE_USO.md` con manual paso a paso de instalación y navegación por todas las funciones.
6. **🌟 README.md de Calidad Internacional:**
   - Actualizar `README.md` con insignias, capturas, instrucciones de instalación, ejemplos de uso de Python, tablas de validación física/química y citas bibliográficas.

---

## 📋 Verificación Obligatoria al Finalizar

```bash
# 1. Backend: 153 tests pasando
pytest backend/tests -v

# 2. Frontend: Compilación exitosa sin errores
npm --prefix frontend run build

# 3. Bitácora de sincronización
# Registrar en 90_System/Agent_Sync/Task_Logs/log_pide_refactor_polish.md
```
