# Santuario Winston — Padrinos sobre arquitectura estática + Supabase

**Fecha:** 2026-09-03
**Estado:** aprobado en conversación

## Decisión

Mantener la arquitectura existente: HTML estático generado para la web pública, Cloudflare Pages para producción y Supabase para autenticación/datos/Edge Functions. No migrar a Next.js.

## Aislamiento

Padrinos se añade como subsistema independiente. No reutiliza `winston_sync_records`, porque esos registros pertenecen a la app/operativa interna. No modifica `winston-web-admin` en la primera fase.

## Tablas

- `sponsor_people`: una persona única para el subsistema de padrinos.
- `sponsorship_residents`: configuración de apadrinamiento por slug público del habitante.
- `sponsorships`: relación persona ↔ habitante.
- `sponsor_payments`: historial económico preparado para Stripe/manual.
- `sponsor_incidents`: incidencias operativas/pago.
- `sponsor_audit_log`: auditoría de acciones del panel.

Todas las tablas tienen RLS habilitado. En fase 1 no se conceden políticas públicas directas; las operaciones administrativas pasan por una Edge Function autenticada con rol `technical` o `admin`.

## Edge Function administrativa

Nueva función `winston-sponsors-admin`, con JWT obligatorio. Valida el usuario con Supabase Auth y `profiles`, exige perfil activo y rol `technical` o `admin`, y usa service role solo dentro de la función.

Acciones fase 1:
- `dashboard`
- `sponsors`
- `sponsorships`
- `resident_settings`
- `save_resident_setting`
- `create_manual_sponsorship`
- `cancel_manual_sponsorship`

## Panel

`administracion.html` incorpora una sección “Padrinos” sin sustituir las secciones actuales. `admin-api.js` añade un cliente separado para la nueva Edge Function. `admin.js` añade vistas y formularios específicos.

## Público

`apadrina.html` seguirá siendo indexable solo en producción y se prepara para el flujo real. En esta fase no se simula ningún cobro ni se publican datos financieros inventados. El botón de pago Stripe solo se activará cuando exista el endpoint de Checkout y credenciales configuradas.

## Stripe — fase siguiente

Stripe se incorporará con otra Edge Function pública específica y webhook firmado. La página de éxito nunca será fuente de verdad. Los cobros se registrarán únicamente tras confirmación de Stripe.

## Criterios de seguridad

- RLS en todas las tablas nuevas.
- Sin `service_role` en navegador.
- Sin acceso directo público a datos personales.
- Email normalizado y único por persona.
- Importe en céntimos enteros.
- No borrar pagos/historial económico desde el panel.
- Auditoría de altas, bajas y cambios de configuración.
- El nuevo subsistema no modifica datos de salud ni registros centrales de la app.
