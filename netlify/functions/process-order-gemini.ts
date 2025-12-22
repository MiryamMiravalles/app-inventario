import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event: any) => {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/['" ]+/g, "").trim();

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falta API KEY" }),
    };
  }

  try {
    const { imageBase64, inventoryNames } = JSON.parse(event.body);
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
Analiza el albarán adjunto. 
  PRODUCTOS DISPONIBLES EN MI SISTEMA: ${
    inventoryNames ? inventoryNames.join(", ") : "Cualquiera"
  }

  REGLA DE CÁLCULO:
  - Si un ítem indica cantidad en cajas (ej: 6 cajas de 35), devuelve el total multiplicado (210).
  - Usa los nombres exactos de los "PRODUCTOS DISPONIBLES" cuando sea posible.

Responde estrictamente con este formato JSON:
  {"items": [{"name": "string", "quantity": number}]}
`;
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
    ]);

    const response = await result.response;
    let text = response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: text,
    };
  } catch (error: any) {
    console.error("--- ERROR ---", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "IA: " + error.message }),
    };
  }
};
