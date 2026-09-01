import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:3001/api" });

export const clientesAPI = {
    listar: (params = {}) => api.get("/clientes", { params }),
    obtener: (id) => api.get(`/clientes/${id}`),
    crear: (datos) => api.post("/clientes", datos),
    actualizar: (id, datos) => api.put(`/clientes/${id}`, datos),
    eliminar: (id) => api.delete(`/clientes/${id}`),
};

export const productosAPI = {
    listar: (params = {}) => api.get("/productos", { params }),
    crear: (datos) => api.post("/productos", datos),
    actualizar: (id, datos) => api.put(`/productos/${id}`, datos),
    eliminar: (id) => api.delete(`/productos/${id}`),
};

export const facturasAPI = {
    listar: (params = {}) => api.get("/facturas", { params }),
    emitir: (datos) => api.post("/facturas", datos),
    xmlUrl: (id) => `http://localhost:3001/api/facturas/${id}/xml`,
};