const API_BASE = "/api"; // Mapped in netlify.toml to /.netlify/functions

const headers = {
  "Content-Type": "application/json",
};

/**
 * Maneja la respuesta de la API, lanzando un error con el mensaje del servidor
 * si el status no es OK (2xx), o devolviendo el cuerpo parseado.
 *
 * Esta versión maneja errores 5xx/4xx con cuerpo de texto/vacío y respuestas
 * 204 No Content (cuerpo vacío en caso de éxito).
 */
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}.`;

    try {
      // Intenta leer el cuerpo como texto (más seguro que json() si el servidor falla)
      const errorText = await res.text();
      if (errorText) {
        // 1. Intenta parsear el texto como JSON si tiene contenido
        try {
          const errorBody = JSON.parse(errorText);
          errorMessage = errorBody.error || errorBody.message || errorMessage;
        } catch (e) {
          // 2. Si no es JSON, usa el texto como mensaje si no es muy largo
          errorMessage =
            errorText.length < 256
              ? errorText
              : `Error del servidor: Cuerpo demasiado grande o no JSON. Estado: ${res.status}.`;
        }
      }
    } catch (e) {
      // Ignoramos errores de lectura de cuerpo si la conexión falló gravemente.
    }

    // Lanza el error capturado (ej: "DB Connection Failed...")
    throw new Error(errorMessage);
  }

  // --- Manejo de Respuesta Exitosa (2xx) ---

  // Clona la respuesta para poder leer el cuerpo dos veces (una para verificar el texto, otra para parsear JSON)
  const clone = res.clone();
  const text = await clone.text();

  if (text.length === 0) {
    // Si la respuesta es 204 No Content, o 200/201 con cuerpo vacío, devolvemos un objeto vacío.
    return {};
  }

  // Si hay contenido, devolvemos el JSON.
  try {
    return res.json();
  } catch (e) {
    throw new Error(
      `Error al procesar la respuesta JSON: El cuerpo de la respuesta no es JSON válido. Contenido: "${text.substring(
        0,
        100
      )}..."`
    );
  }
};

export const api = {
  sessions: {
    list: () => fetch(`${API_BASE}/sessions`).then(handleResponse),
    save: (data: any) =>
      fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_BASE}/sessions?id=${id}`, { method: "DELETE" }).then(
        handleResponse
      ),
  },
  inventory: {
    list: () => fetch(`${API_BASE}/inventory`).then(handleResponse),
    save: (data: any) =>
      fetch(`${API_BASE}/inventory`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_BASE}/inventory?id=${id}`, { method: "DELETE" }).then(
        handleResponse
      ),
    bulkUpdate: (
      updates: {
        id?: string;
        name: string;
        stock: number;
        mode: "set" | "add";
      }[]
    ) =>
      fetch(`${API_BASE}/inventory`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updates),
      }).then(handleResponse),
  },
  orders: {
    list: () => fetch(`${API_BASE}/orders`).then(handleResponse),
    save: (data: any) =>
      fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_BASE}/orders?id=${id}`, { method: "DELETE" }).then(
        handleResponse
      ),
  },
  history: {
    list: () => fetch(`${API_BASE}/history`).then(handleResponse),
    save: (data: any) =>
      fetch(`${API_BASE}/history`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }).then(handleResponse),
    deleteAll: () =>
      fetch(`${API_BASE}/history`, { method: "DELETE" }).then(handleResponse),
    // CORRECCIÓN AÑADIDA: Función delete para eliminar un registro individual
    delete: (id: string) =>
      fetch(`${API_BASE}/history?id=${id}`, { method: "DELETE" }).then(
        handleResponse
      ),
    download: (id: string) =>
      fetch(`${API_BASE}/history?id=${id}&format=csv`, {
        method: "GET",
      }),
  },
  config: {
    getIncomeSources: () => fetch(`${API_BASE}/config`).then(handleResponse),
    saveIncomeSources: (sources: any[]) =>
      fetch(`${API_BASE}/config`, {
        method: "POST",
        headers,
        body: JSON.stringify(sources),
      }).then(handleResponse),
  },
};
