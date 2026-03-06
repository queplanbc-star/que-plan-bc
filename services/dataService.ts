import { CulturalEvent } from "../types";

// ---------------------------------------------------------------------------
// CONFIGURACIÓN GOOGLE SHEETS
// ---------------------------------------------------------------------------
const SHEET_ID = '179rvDzrKpJ1P94RCDOu6KyGgOf7kGw4BBQupYlFSCw0';
const SHEET_NAME = 'Hoja 1';

export interface AppConfig {
    sharePhrase: string;
    previewImageUrl: string;
}

export const fetchConfig = async (): Promise<AppConfig> => {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Configuracion&range=A:B&headers=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        const text = await response.text();
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        
        if (start === -1 || end === -1) throw new Error("No JSON found");

        const json = JSON.parse(text.substring(start, end));
        const rows = json.table?.rows || [];

        // Default config
        let config: AppConfig = {
            sharePhrase: "¡Mira este plan que armé en Qué Plan!",
            previewImageUrl: ""
        };

        // Iterate rows to find keys in Column A and values in Column B
        // This handles the Key-Value structure (Vertical)
        rows.forEach((row: any) => {
            const key = row.c?.[0]?.v; // Column A
            const value = row.c?.[1]?.v; // Column B
            
            if (typeof key === 'string') {
                const normalizedKey = key.trim().toLowerCase();
                if (normalizedKey === 'frase_compartir') {
                    config.sharePhrase = value ? String(value) : config.sharePhrase;
                }
                if (normalizedKey === 'url_imagen_preview') {
                    config.previewImageUrl = value ? String(value) : config.previewImageUrl;
                }
            }
        });
        
        return config;

    } catch (error) {
        console.error("Error loading config:", error);
        return { sharePhrase: "¡Mira este plan que armé en Qué Plan!", previewImageUrl: "" };
    }
};

export const fetchAvatars = async (): Promise<string[]> => {
    // Request range A:B from 'Avatares' sheet
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Avatares&range=A:B&headers=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        const text = await response.text();
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        
        if (start === -1 || end === -1) throw new Error("No JSON found");

        const json = JSON.parse(text.substring(start, end));
        
        // Check if table exists
        if (!json.table) {
            console.error("Error: La pestaña 'Avatares' no parece existir o no tiene datos válidos.");
            return [];
        }

        const rows = json.table.rows || [];

        return rows.map((row: any) => {
            // Assuming Column A is ID, Column B is URL
            // row.c[0] -> ID
            // row.c[1] -> URL
            const cell = row.c?.[1]; 
            return cell?.v ? String(cell.v) : "";
        }).filter((url: string) => url.startsWith('http'));
    } catch (error) {
        console.error("Error loading avatars. Verifica que la pestaña se llame exactamente 'Avatares'.", error);
        return [];
    }
};

export const fetchEvents = async (): Promise<CulturalEvent[]> => {
    // Se agrega headers=1 para intentar excluir la fila de encabezados de los datos devueltos
    // IMPORTANTE: El nombre de la hoja debe estar codificado (espacios -> %20)
    // Added range A:H as requested
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}&range=A:H&headers=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        
        // Extracción robusta del JSON: busca desde el primer '{' hasta el último '}'
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        
        if (start === -1 || end === -1) {
             throw new Error("No se encontró JSON válido en la respuesta de Google Sheets.");
        }

        const jsonString = text.substring(start, end);
        const json = JSON.parse(jsonString);
        
        const rows = json.table?.rows;
        
        if (!rows || rows.length === 0) {
            console.warn("La respuesta de Google Sheets no contiene filas de datos.");
            return [];
        }

        // Mapeo de columnas:
        // A(0): titulo, B(1): categoria, C(2): fecha, D(3): hora, 
        // E(4): imagen, F(5): descripcion, G(6): lugar, H(7): link_mapa
        
        return rows.map((row: any, index: number) => {
            const c = row.c || [];
            
            // Helper para obtener valor de celda, priorizando 'v' (valor)
            const getVal = (i: number) => {
                const cell = c[i];
                if (!cell) return "";
                return cell.v !== null && cell.v !== undefined ? String(cell.v) : "";
            };

            // Procesamiento de Fecha (Columna C / Index 2)
            let dateStr = "";
            const rawDate = c[2]?.v;
            // const formattedDate = c[2]?.f; // Unused

            if (typeof rawDate === 'string' && rawDate.indexOf('Date') !== -1) {
                // Parsear formato API: "Date(2024,0,15)" -> "2024-01-15"
                const nums = rawDate.match(/\d+/g);
                if (nums && nums.length >= 3) {
                    const y = nums[0];
                    const m = String(Number(nums[1]) + 1).padStart(2, '0'); // Meses 0-based
                    const d = String(nums[2]).padStart(2, '0');
                    dateStr = `${y}-${m}-${d}`;
                }
            } else {
                 // Si no es formato Date(...), tomamos el valor tal cual.
                 dateStr = getVal(2);
            }

            // Procesamiento de Hora (Columna D / Index 3)
            const timeStr = c[3]?.f || getVal(3);

            // Imagen fallback si está vacía
            const imgUrl = getVal(4) || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000";

            return {
                id: `sheet-${index}`,
                title: getVal(0) || "Evento sin título",
                category: (getVal(1) || "General").trim(),
                date: dateStr, 
                time: timeStr,
                imageUrl: imgUrl,
                description: getVal(5),
                location: getVal(6),
                mapsUrl: getVal(7),
                cost: getVal(8),
            };
        });

    } catch (error) {
        console.error("Error cargando eventos desde Google Sheets:", error);
        console.warn("⚠️ POSIBLE SOLUCIÓN: Asegúrate de que tu Google Sheet sea PÚBLICO. Ve a 'Compartir' -> 'Cualquier persona con el enlace' -> 'Lector'. Si es privado, fallará con error de red (CORS).");
        return [];
    }
};