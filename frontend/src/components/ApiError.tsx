export default function ApiError({ error }: { error?: string }) {
  if (!error) return null;
  return <div className="error">{error}</div>;
}
