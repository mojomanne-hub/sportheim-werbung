export default function SpielplanPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#fff',
    }}>
      <div style={{
        width: '200%',
        height: '200%',
        marginLeft: '-45%',
        marginTop: '-15%',
      }}>
        <iframe
          src="https://sportheim-werbung.vercel.app/widget/DEINE_ID"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>
    </div>
  )
}