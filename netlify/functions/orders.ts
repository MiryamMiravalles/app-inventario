import { Handler } from "@netlify/functions";
import connectToDatabase from "./utils/data";
import { InventoryItemModel, PurchaseOrderModel } from "./models"; // MODIFICADO: Importar InventoryItemModel
import mongoose from "mongoose";

export const handler: Handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectToDatabase();
    console.log("Database connection established for orders function.");
  } catch (dbError) {
    console.error("Database Connection Error (orders):", dbError);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      },
      body: JSON.stringify({
        error: (dbError as any).message || "Failed to connect to database.",
      }),
    };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const collection = PurchaseOrderModel;
    const ObjectId = mongoose.Types.ObjectId;

    if (event.httpMethod === "GET") {
      const orders = await (collection.find as any)().sort({ orderDate: -1 });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(orders),
      };
    }

    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}");
      const orderToSave: any = { ...data };

      const inventoryCollection = InventoryItemModel;

      // 🛑 PASO 1: Buscar precios unitarios del inventario actual
      if (orderToSave.items && Array.isArray(orderToSave.items)) {
        const itemIds = orderToSave.items.map(
          (item: any) => item.inventoryItemId
        );

        // Buscar los ítems de inventario basándose en el ID (asumiendo que id es el campo)
        const inventoryItems = await (inventoryCollection.find as any)({
          id: { $in: itemIds },
        });

        const priceMap = new Map(
          inventoryItems.map((item: any) => [
            item.id,
            item.pricePerUnitWithoutIVA || 0,
          ])
        );

        // 🛑 PASO 2: Inyectar el precio actual en cada ítem del pedido
        orderToSave.items = orderToSave.items.map((item: any) => {
          const currentPrice = priceMap.get(item.inventoryItemId) || 0;

          return {
            ...item,
            // Aseguramos que se guarde el precio unitario sin IVA del momento de la compra
            pricePerUnitWithoutIVA: currentPrice,
          };
        });
      }

      // Manejo de IDs (lógica existente ajustada para Mongoose)
      let _idToSave: any = orderToSave.id;

      // Si no tiene ID o si el ID es un string no válido para ObjectId, lo tratamos como nuevo o usamos el string.
      if (!_idToSave) {
        _idToSave = new ObjectId();
      } else if (ObjectId.isValid(_idToSave)) {
        _idToSave = new ObjectId(_idToSave);
      } else {
        _idToSave = String(orderToSave.id);
      }

      orderToSave._id = _idToSave;
      delete orderToSave.id;

      const updatedOrNewOrder = await (collection.findOneAndUpdate as any)(
        { _id: orderToSave._id },
        { $set: orderToSave },
        { new: true, upsert: true, runValidators: true }
      );

      console.log(`Order processed successfully: ${updatedOrNewOrder._id}`);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(updatedOrNewOrder),
      };
    }

    if (event.httpMethod === "DELETE") {
      const { id } = event.queryStringParameters || {};

      await (collection.findByIdAndDelete as any)(id);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Deleted" }),
      };
    }

    return { statusCode: 405, headers, body: "Method Not Allowed" };
  } catch (error: any) {
    console.error("Error executing orders function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};
