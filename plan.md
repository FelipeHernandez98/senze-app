# Plan de trabajo para implementar métricas (SaaS de inventario)

## 1. Alcance actual

Este plan está enfocado en **una sola empresa**.

Implicaciones para esta etapa:
- No se implementa multi-tenant.
- No se agrega `tenant_id` en entidades por ahora.
- Todas las métricas se calculan sobre los datos globales de la instancia.

## 2. Objetivo

Implementar un módulo de analítica en el backend que entregue métricas útiles para dashboard y operación diaria, con una primera versión estable, rápida y fácil de mantener.

## Estado de fases

- [ ] Fase 0. Alineación funcional y técnica (pendiente de cerrar reglas finales de operación).
- [x] Fase 1. Estructura base del módulo analytics.
- [x] Fase 2. Dashboard core (MVP).
- [x] Fase 3. Rankings (productos, vendedores, clientes).
- [x] Fase 4. Inventario bajo (`minStock` + umbral global opcional).
- [x] Fase 5. Calidad, pruebas y rendimiento mínimo.
- [x] Fase 6. Automatizaciones y reportes (payloads + exportación CSV).

## 3. Supuestos funcionales (cerrar antes de codificar)

1. Zona horaria oficial del negocio para cálculos de "día" y "mes".
2. Definición de ticket promedio: por día y por rango personalizado.
3. Política sobre ventas modificadas/eliminadas y su efecto en históricos.
4. Regla de inventario bajo:
   - Opción rápida: umbral global (ej. `5`).
   - Opción recomendada: `minStock` por producto (fase posterior o incluida en MVP extendido).

---

## Fase 0. Alineación funcional y técnica

**Objetivo:** evitar ambigüedades antes de implementar.

**Tareas:**
1. Definir timezone oficial para reportes.
2. Definir contrato de filtros comunes (`from`, `to`, `limit`).
3. Definir acceso: `administrator` y `user`.
4. Definir formato de respuesta del dashboard.

**Entregables:**
- Documento corto de reglas de negocio.
- Ejemplos de respuestas JSON para frontend.

**Criterio de terminado:**
- No hay dudas abiertas sobre cómo calcular cada métrica del MVP.

---

## Fase 1. Estructura base del módulo analytics

**Objetivo:** crear el módulo analítico con arquitectura limpia y reutilizable.

**Tareas:**
1. Crear carpeta `src/analytics/` con:
   - `analytics.module.ts`
   - `analytics.controller.ts`
   - `analytics.service.ts`
   - `dto/analytics-filter.dto.ts`
   - `dto/dashboard-response.dto.ts`
2. Registrar `AnalyticsModule` en `src/app.module.ts`.
3. Aplicar seguridad con `@Auth(Roles.administrator, Roles.user)`.

**Entregables:**
- Endpoints base disponibles y protegidos.

**Criterio de terminado:**
- Módulo compila, levanta y responde en rutas de analytics.

---

## Fase 2. Dashboard core (MVP)

**Objetivo:** entregar el panel principal con métricas de alto valor.

**Endpoint principal sugerido:**
- `GET /analytics/dashboard?from=&to=`

**Métricas a implementar:**
1. Ventas del día.
2. Ventas del mes.
3. Número de ventas del día.
4. Ticket promedio del día.
5. Cantidad de productos vendidos del día.
6. Evolución de ventas en el tiempo (últimos 7/15/30 días).

**Implementación técnica recomendada:**
- Usar `QueryBuilder` de TypeORM con `SUM`, `COUNT`, `GROUP BY`.
- Centralizar funciones de rango de fechas en el servicio.

**Entregables:**
- Endpoint `/analytics/dashboard` con JSON completo para UI.

**Criterio de terminado:**
- El frontend puede renderizar tarjetas y gráfica de tendencia solo con este endpoint.

---

## Fase 3. Rankings (productos, vendedores, clientes)

**Objetivo:** habilitar análisis de desempeño y priorización comercial.

**Endpoints sugeridos:**
1. `GET /analytics/top-products?from=&to=&limit=10`
2. `GET /analytics/sales-by-user?from=&to=&limit=10`
3. `GET /analytics/top-clients?from=&to=&limit=10`

**Métricas cubiertas:**
- Productos más vendidos.
- Ventas por empleado.
- Clientes con más compras.

**Entregables:**
- 3 endpoints de ranking con filtros por rango y límite.

**Criterio de terminado:**
- Respuesta ordenada descendentemente y validada con datos reales.

---

## Fase 4. Inventario bajo

**Objetivo:** detectar riesgo de agotamiento de forma temprana.

**Versión inicial (rápida):**
- `GET /analytics/low-stock?threshold=5`

**Versión recomendada (si se decide en esta fase):**
1. Agregar campo `minStock` a `Product`.
2. Ajustar DTOs de producto.
3. Cambiar consulta de inventario bajo a `stock <= minStock`.

**Entregables:**
- Endpoint de productos con bajo inventario.

**Criterio de terminado:**
- Lista confiable de productos críticos para reposición.

---

## Fase 5. Calidad, pruebas y rendimiento mínimo

**Objetivo:** dejar el módulo listo para uso continuo.

**Tareas:**
1. Unit tests para `analytics.service.ts`.
2. Pruebas e2e para endpoints clave (`dashboard`, rankings, low-stock).
3. Agregar índices en BD para acelerar consultas:
   - `sales(createdAt)`
   - `sales(user_id, createdAt)`
   - `sales(client_id, createdAt)`
   - `sale_details(product_id)`
4. Revisar tiempos de respuesta con datos de prueba.

**Entregables:**
- Suite de pruebas pasando.
- Consultas con tiempos consistentes.

**Criterio de terminado:**
- Las rutas de analytics son estables y no degradan notablemente el sistema.

---

## Fase 6. Automatizaciones y reportes (iteración 2)

**Objetivo:** pasar de analítica pasiva a monitoreo proactivo.

**Tareas:**
1. Reporte diario automático (ventas, transacciones, ticket promedio, top productos).
2. Alertas de inventario bajo por correo/webhook.
3. Exportación CSV por filtros (`from`, `to`, `userId`, `clientId`, `productId`).

**Entregables:**
- Mecanismo de reporte periódico.
- Exportación de reportes para análisis externo.

**Criterio de terminado:**
- El negocio puede recibir indicadores sin entrar al sistema.

---

## 4. Orden de ejecución recomendado

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4
6. Fase 5
7. Fase 6

## 5. Backlog posterior (cuando se abra a varias empresas)

1. Multi-tenant (`tenant_id`, aislamiento de consultas y autenticación por empresa).
2. Tabla agregada diaria para acelerar dashboards históricos.
3. Jobs de consolidación nocturna.
4. Predicción de agotamiento con promedio móvil de ventas.

## 6. Primer sprint sugerido (1-2 semanas)

1. Fase 0 completa.
2. Fase 1 completa.
3. Fase 2 completa.
4. Inicio de Fase 3 (`top-products` y `sales-by-user`).

Resultado esperado del sprint:
- Dashboard funcional en backend para consumo del frontend.
