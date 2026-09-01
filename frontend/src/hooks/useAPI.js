import { useState, useEffect, useCallback } from "react";

export function useAPI(apiFn, deps = []) {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const res = await apiFn();
            setDatos(res.data);
        } catch (e) {
            setError(e.response?.data?.error || "Error de conexión con el servidor");
        } finally {
            setCargando(false);
        }
    }, deps);

    useEffect(() => {
        cargar();
    }, [cargar]);

    return { datos, cargando, error, recargar: cargar };
}