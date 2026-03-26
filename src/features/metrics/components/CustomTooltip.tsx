export default function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          color: '#f1f5f9',
          fontSize: 13,
          padding: '8px',
        }}
      >
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: 0, color: '#f1f5f9' }}>
            {entry.name.toUpperCase()}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}
