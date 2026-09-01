export default function Spinner({ texto = "Cargando..." }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <p>{texto}</p>
    </div>
  );
}
