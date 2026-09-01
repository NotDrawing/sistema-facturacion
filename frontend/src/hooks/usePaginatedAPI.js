import { useState, useEffect, useCallback } from "react";

export function usePaginatedAPI(apiFn, { limit = 10 } = {}) {
    const [datos, setDatos] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelado = false;

        (async () => {
            setCargando(true);
            setError(null);
            try {
                const res = await apiFn({ page, limit });
                if (cancelado) return;

                const body = res.data;

                if (Array.isArray(body)) {
                    setDatos(body);
                    setTotal(body.length);
                    setTotalPages(1);
                } else {
                    setDatos(body?.data || []);
                    setTotal(body?.total ?? 0);
                    setTotalPages(Math.max(1, body?.totalPages ?? 1));
                }
            } catch (e) {
                if (cancelado) return;
                console.error("usePaginatedAPI error:", e);
                setError(
                    e.response?.data?.error || e.message || "Error de conexión con el servidor"
                );
                setDatos([]);
                setTotal(0);
                setTotalPages(1);
            } finally {
                if (!cancelado) setCargando(false);
            }
        })();

        return () => {
            cancelado = true;
        };
    }, [apiFn, page, limit, reloadKey]);

    const irAPagina = useCallback((p) => {
        const next = Math.max(1, parseInt(p, 10) || 1);
        setPage(next);
    }, []);

    const recargar = useCallback(() => {
        setReloadKey((k) => k + 1);
    }, []);

    return {
        datos,
        total,
        page,
        totalPages,
        limit,
        cargando,
        error,
        irAPagina,
        recargar,
        setPage,
    };
}