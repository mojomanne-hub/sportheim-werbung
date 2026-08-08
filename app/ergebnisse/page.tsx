export default function ErgebnissePage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#fff',
    }}>
      <iframe
        src="https://www.fussball.de/club/tsv-kirchberg-1921"
        style={{
          width: '200%',
          height: '200%',
          border: 'none',
          marginLeft: '-25%',
          marginTop: '-15%',
        }}
      />
    </div>
  )
}