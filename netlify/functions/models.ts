import mongoose, { Schema } from "mongoose";

// ----------------------------------------------------
// --- Definiciones de Esquemas de Inventario y Pedidos ---
// ----------------------------------------------------

const InventoryItemSchema = new Schema(
  {
    // 🛑 CORRECCIÓN CLAVE 1: Mantenemos el campo 'id' como el ID principal del documento
    // y lo usamos como el campo que el frontend genera (UUID).
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: String,
    pricePerUnitWithoutIVA: { type: Number, required: false, default: 0 },
    // 🛑 CORRECCIÓN CLAVE 2: Añadir `minimize: false` para Map.
    // Esto asegura que el Map `stockByLocation` no se elimine si está vacío,
    // previniendo errores de actualización sutiles en Mongoose.
    stockByLocation: { type: Map, of: Number, minimize: false },
  },
  // 🛑 CORRECCIÓN CLAVE 3: Dejamos que Mongoose gestione el _id interno (ObjectId)
  // pero aseguramos que el ID del frontend se mantenga en el root.
  // Quitamos `_id: false` para que Mongoose cree su propio _id, y confiamos en
  // el transform para mapear `id` al exterior.
  { timestamps: true }
);

InventoryItemSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret: any) {
    // Si usaste el ID del frontend como _id (opción vieja), úsalo. Si no, usa el campo 'id'.
    // Esta línea simplifica el mapeo para el frontend, que solo necesita `id`.
    ret.id = ret.id;
    delete ret._id; // Eliminamos el _id interno de Mongoose de la respuesta
  },
});

// 🛑 Reforzamiento de campos requeridos para PurchaseOrderSchema
const PurchaseOrderSchema = new Schema(
  {
    _id: { type: String, required: true }, // ID generado por el frontend (UUID)
    orderDate: { type: String, required: true },
    deliveryDate: String,
    supplierName: { type: String, required: true },
    status: { type: String, required: true },
    totalAmount: Number,
    items: [
      {
        inventoryItemId: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        costAtTimeOfPurchase: { type: Number, default: 0 }, // Establece default=0 para que no sea requerido si no se envía
        pricePerUnitWithoutIVA: { type: Number, default: 0 }, // 🛑 AÑADIDO: Precio en el momento del pedido
      },
    ],
  },
  { _id: false, timestamps: true }
);

PurchaseOrderSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret: any) {
    ret.id = ret._id;
    delete ret._id;
  },
});

// Definición del sub-esquema para los ítems del registro de inventario
const InventoryRecordItemSchema = new Schema(
  {
    itemId: String,
    name: String,
    category: String,
    pricePerUnitWithoutIVA: Number, // 🛑 AÑADIDO: Precio para el historial de análisis/snapshot
    currentStock: Number,
    pendingStock: Number,
    initialStock: Number,
    endStock: Number,
    consumption: Number,
    stockByLocationSnapshot: { type: Map, of: Number, minimize: false }, // 🛑 Añadido minimize: false
  },
  { _id: false }
);

// Esquema completo para InventoryRecord
const InventoryRecordSchema = new Schema(
  {
    _id: { type: String, required: true },
    date: String,
    label: String,
    type: String,
    items: [InventoryRecordItemSchema],
  },
  { _id: false, timestamps: true }
);

InventoryRecordSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret: any) {
    ret.id = ret._id;
    delete ret._id;
  },
});

// --- Exportaciones de Modelos ---

export const InventoryItemModel =
  mongoose.models.InventoryItem ||
  mongoose.model("InventoryItem", InventoryItemSchema);
export const PurchaseOrderModel =
  mongoose.models.PurchaseOrder ||
  mongoose.model("PurchaseOrder", PurchaseOrderSchema);
export const InventoryRecordModel =
  mongoose.models.InventoryRecord ||
  mongoose.model("InventoryRecord", InventoryRecordSchema);
