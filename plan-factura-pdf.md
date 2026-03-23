# Plan: Generación de facturas en PDF

## 1. Tecnología recomendada

**Puppeteer** es la mejor opción para este caso porque:

- El diseño ya existe en `factura.html` con CSS completo.
- Puppeteer genera PDFs de alta fidelidad directamente desde HTML renderizado.
- Funciona bien con contenido dinámico (tablas de N filas, imágenes base64, QR).
- Se controla fácilmente desde NestJS como un provider.

Alternativa considerada y descartada: `PDFKit` requeriría reescribir el diseño en código; `wkhtmltopdf` no se mantiene activamente.

---

## 2. Análisis de campos del template `factura.html`

### ✅ Campos disponibles hoy en el sistema

| Campo en template     | Fuente en el sistema                                    |
|-----------------------|---------------------------------------------------------|
| `{{invoice_number}}`  | `sale.id` (UUID). Se puede truncar o prefixar con `FAC-` |
| `{{invoice_date}}`    | `sale.createdAt`                                        |
| `{{seller}}`          | `sale.user.firstName + sale.user.lastName`              |
| `{{client_name}}`     | `sale.client.firstName + sale.client.lastName`          |
| `{{client_document}}` | `sale.client.documentNumber` + `sale.client.documentType` |
| `{{client_phone}}`    | `sale.client.phone`                                     |
| `{{client_address}}`  | `sale.client.address`                                   |
| `{{items}}`           | `sale.details[]` → generado como filas `<tr>` con `product.reference`, `quantity`, `price`, total de línea |
| `{{subtotal}}`        | `sale.total` (el sistema no guarda IVA separado, ver sección 3) |
| `{{total}}`           | `sale.total`                                            |

### ⚠️ Campos faltantes o incompletos

| Campo en template        | Situación actual                                          | Solución posible                                                                 |
|--------------------------|-----------------------------------------------------------|----------------------------------------------------------------------------------|
| `{{logo_url}}`           | No existe en el modelo. La imagen va embebida en el PDF.  | Incrustar el logo como base64 en el servicio, o leerlo desde disco.              |
| `{{company_name}}`       | No existe en el modelo. Dato estático del negocio.        | Agregar variable de entorno `COMPANY_NAME` en `.env`.                            |
| `{{company_nit}}`        | No existe en el modelo.                                   | Agregar variable de entorno `COMPANY_NIT`.                                       |
| `{{company_address}}`    | No existe en el modelo.                                   | Agregar variable de entorno `COMPANY_ADDRESS`.                                   |
| `{{company_phone}}`      | No existe en el modelo.                                   | Agregar variable de entorno `COMPANY_PHONE`.                                     |
| `{{company_email}}`      | No existe en el modelo.                                   | Agregar variable de entorno `COMPANY_EMAIL`.                                     |
| `{{payment_method}}`     | No existe en la entidad `Sale`.                           | **Opción A:** Agregar campo `paymentMethod` a `Sale` (ej. efectivo, tarjeta, transferencia). **Opción B:** usar texto fijo "Efectivo" si no es relevante aún. |
| `{{invoice_status}}`     | No existe en la entidad `Sale`.                           | **Opción A:** Agregar campo `status` a `Sale` (ej. pagada, pendiente). **Opción B:** mostrar siempre "Pagada" si el sistema no maneja estados. |
| `{{tax}}`                | `Sale` solo guarda `total`. No se desglosa IVA.           | **Opción A:** Tratar `total` como base y calcular IVA encima (ej. 19%) antes de guardar. **Opción B:** mostrar IVA = $0 o "No aplica" si el negocio no cobra IVA. **Opción C:** Agregar columna `taxAmount` a `Sale`. |
| `{{qr_code}}`            | No existe lógica de QR en el sistema.                     | Generar QR en base64 con librería `qrcode` apuntando a la URL de la factura o al ID de la venta. |

---

## 3. Decisiones que debes tomar antes de generar código

Estas son las preguntas abiertas que deben responderse para implementar sin suposiciones:

### 3.1 ¿El negocio cobra IVA?
- **Sí**: Hay que definir si el precio del producto ya incluye IVA o si se adiciona al total. Esto afecta si se agrega una columna a `Product` o si se calcula un porcentaje sobre `sale.total`.
- **No**: Se puede mostrar IVA como `$0` o eliminar esa fila del template.

### 3.2 ¿Se necesita número de factura secuencial o basta con el UUID?
- El `sale.id` es un UUID como `3fa85f64-5717-4562-b3fc-2c963f66afa6`, lo cual no es presentable como número de factura.
- **Opción A**: Agregar columna `invoiceNumber` auto-incremental a `Sale`.
- **Opción B**: Usar los últimos 8 caracteres del UUID con un prefijo (ej. `FAC-66AFA6`).
- **Opción C**: Crear una tabla separada de numeración de facturas.

### 3.3 ¿Se registra el método de pago?
- ¿El vendedor selecciona efectivo, tarjeta, etc. al crear la venta?
- Si sí, hay que agregar el campo `paymentMethod` a la entidad `Sale` y al `CreateSaleDto`.

### 3.4 ¿Las ventas tienen estados (pagada, pendiente, anulada)?
- Si no hay estados, el campo `{{invoice_status}}` se puede fijar en "Pagada".
- Si se planea manejar estados, conviene agregar una columna `status` con un enum antes de implementar la factura.

### 3.5 ¿El QR debe apuntar a algo específico?
- URL de consulta pública de la factura (requeriría un endpoint público).
- Simplemente encodear el ID de la venta o el número de factura en el QR.

---

## 4. Estructura del módulo a implementar

```
src/
  invoice/
    invoice.module.ts
    invoice.service.ts          ← genera el HTML y el PDF
    invoice.controller.ts       ← endpoint GET /invoice/:saleId
    templates/
      factura.html              ← copia del template con placeholders
```

El archivo `factura.html` se mueve (o copia) aquí para que el servicio lo lea en tiempo de ejecución con `fs.readFileSync`.

---

## 5. Paso a paso de implementación

### Paso 1 — Instalar dependencias

```bash
npm install puppeteer
npm install qrcode
npm install @types/qrcode --save-dev
```

> **Nota sobre Puppeteer**: En servidores Linux (como un contenedor Docker) necesita librerías del sistema. En desarrollo local en Windows funciona sin configuración adicional.

---

### Paso 2 — Variables de entorno de la empresa

Agregar en `.env`:

```env
COMPANY_NAME=Nombre del negocio
COMPANY_NIT=900.000.000-0
COMPANY_ADDRESS=Calle 10 # 30-15, Medellín
COMPANY_PHONE=604 321 0000
COMPANY_EMAIL=info@negocio.com
LOGO_PATH=assets/logo.png   # ruta local o URL pública
```

---

### Paso 3 — (Opcional pero recomendado) Ajustes a la entidad `Sale`

Dependiendo de las respuestas a la sección 3, agregar a `Sale`:

```typescript
// si se decide manejar método de pago
@Column({ name: 'payment_method', nullable: true })
paymentMethod?: string;

// si se decide manejar estado de factura
@Column({ default: 'pagada' })
status: string;
```

Y actualizar `CreateSaleDto` con los campos correspondientes.

---

### Paso 4 — Crear `InvoiceService`

Responsabilidades:
1. Recibir el ID de la venta.
2. Cargar la venta completa con sus relaciones (`user`, `client`, `details.product`).
3. Generar el QR como base64 del número/ID de factura.
4. Convertir el logo a base64 (para que Puppeteer lo pinte correctamente en PDF offline).
5. Reemplazar todos los `{{placeholder}}` en el HTML con los valores reales.
6. Generar la tabla de `{{items}}` construyendo filas `<tr>` dinámicas.
7. Lanzar Puppeteer, renderizar el HTML y devolver el `Buffer` del PDF.

---

### Paso 5 — Crear `InvoiceController`

Rutas a exponer:

| Método | Ruta                   | Descripción                                            |
|--------|------------------------|--------------------------------------------------------|
| `GET`  | `/invoice/:saleId`     | Descarga el PDF de la factura para una venta concreta  |
| `GET`  | `/invoice/:saleId/preview` | (Opcional) Devuelve el HTML renderizado para previsualización |

Ambas rutas deben estar protegidas con `@Auth(Roles.administrator, Roles.user)`.

---

### Paso 6 — Registrar `InvoiceModule` en `AppModule`

El módulo debe importar `SaleModule` (o el repositorio de `Sale` directamente) para acceder a los datos de la venta con todas sus relaciones.

---

## 6. Resumen de decisiones pendientes

| # | Pregunta                              | Opciones                               |
|---|---------------------------------------|----------------------------------------|
| 1 | ¿El negocio cobra IVA?                | Sí (definir %) / No (mostrar $0)       |
| 2 | ¿Número de factura secuencial?        | UUID truncado / auto-incremental / tabla aparte |
| 3 | ¿Se registra método de pago?          | Agregar campo a `Sale` / texto fijo    |
| 4 | ¿Se registra estado de la venta?      | Agregar campo `status` / "Pagada" fijo |
| 5 | ¿El QR qué debe contener?             | ID de venta / URL pública / número de factura |
| 6 | ¿El logo viene de URL pública o disco? | URL remota / archivo local             |

## 7. Decisiones tomadas (marzo 2026)

1. No se cobra IVA por ahora (`tax = 0`).
2. El número de factura será secuencial.
3. Se registrará método de pago en la venta.
4. Se registrará estado de la venta/factura.
5. El QR codificará el número de factura.
6. El logo estará en disco local con nombre base `logo-factura.png`.
