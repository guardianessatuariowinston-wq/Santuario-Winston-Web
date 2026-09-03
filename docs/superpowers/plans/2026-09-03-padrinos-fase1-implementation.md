# Padrinos Fase 1 Implementation Plan

> Ejecutar sobre la copia aislada del ZIP y mantener los 53 tests existentes verdes.

**Goal:** añadir el núcleo de Padrinos, administración y preparación pública sin activar cobros Stripe todavía.

**Architecture:** tablas dedicadas + RLS + Edge Function administrativa separada + ampliación incremental del panel HTML existente.

## Task 1 — Tests de contrato
- Crear `tests/sponsorships.test.mjs` con expectativas de archivos, navegación, acciones y seguridad.
- Ejecutar y comprobar FAIL.

## Task 2 — Migración de base de datos
- Crear `supabase/migrations/20260903_sponsorships_phase1.sql`.
- Aplicar como migración Supabase `sponsorships_phase1`.
- Verificar tablas, constraints y RLS.

## Task 3 — Edge Function independiente
- Crear `supabase/functions/winston-sponsors-admin/index.ts`.
- Implementar autenticación, rol, listados, configuración y altas/bajas manuales.
- Desplegar con JWT obligatorio.
- Verificar endpoint con sesión válida antes de conectar UI.

## Task 4 — Panel
- Añadir navegación Padrinos.
- Añadir endpoint separado en `admin-api.js`.
- Añadir dashboard/listado/configuración/alta manual a `admin.js`.
- Añadir estilos sin alterar funciones existentes.

## Task 5 — Página pública
- Mejorar `apadrina.html` para explicar el nuevo sistema sin fingir un checkout activo.
- Añadir marcadores estructurales que usará Stripe en fase 2.

## Task 6 — Build y regresión
- Actualizar baseline admin tras revisar el diff intencional.
- Ejecutar build staging y 100 % tests.
- Ejecutar advisors de seguridad Supabase.
- Generar ZIP de entrega.
