export default function SpielplanPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#fff',
    }}>
      <iframe
        src="https://sportheim-werbung.vercel.app/widget/df2f6bf0-ec97-4a69-9a6d-9efee44fac96"
        style={{
          width: '250%',
          height: '250%',
          border: 'none',
          marginLeft: '-30%',
          marginTop: '-15%',
        }}
      />
    </div>
  )
}