export default function Paginacion({
  page,
  totalPages,
  total,
  limit,
  onChange,
  cargando,
}) {
  if (totalPages <= 1 && total <= limit) {
    return total > 0 ? (
      <div className="pagination-bar" role="navigation" aria-label="Paginación">
        <span className="pagination-info">
          {total} registro{total === 1 ? "" : "s"}
        </span>
      </div>
    ) : null;
  }

  const desde = total === 0 ? 0 : (page - 1) * limit + 1;
  const hasta = Math.min(page * limit, total);

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination-bar" role="navigation" aria-label="Paginación">
      <span className="pagination-info">
        {desde}–{hasta} de {total}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          disabled={page <= 1 || cargando}
          onClick={() => onChange(1)}
          title="Primera página"
          aria-label="Primera página"
        >
          «
        </button>
        <button
          type="button"
          className="pagination-btn"
          disabled={page <= 1 || cargando}
          onClick={() => onChange(page - 1)}
          title="Página anterior"
          aria-label="Página anterior"
        >
          ‹
        </button>
        {start > 1 && (
          <span className="pagination-ellipsis" aria-hidden="true">
            …
          </span>
        )}
        {pages.map((p) => (
          <button
            type="button"
            key={p}
            className={`pagination-btn${p === page ? " is-active" : ""}`}
            disabled={cargando}
            onClick={() => onChange(p)}
            aria-label={`Página ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <span className="pagination-ellipsis" aria-hidden="true">
            …
          </span>
        )}
        <button
          type="button"
          className="pagination-btn"
          disabled={page >= totalPages || cargando}
          onClick={() => onChange(page + 1)}
          title="Página siguiente"
          aria-label="Página siguiente"
        >
          ›
        </button>
        <button
          type="button"
          className="pagination-btn"
          disabled={page >= totalPages || cargando}
          onClick={() => onChange(totalPages)}
          title="Última página"
          aria-label="Última página"
        >
          »
        </button>
      </div>
    </div>
  );
}
