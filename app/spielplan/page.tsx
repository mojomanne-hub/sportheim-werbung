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
          width: '150%',
          height: '150%',
          border: 'none',
          marginLeft: '-20%',
          marginTop: '-10%',
        }}
      />
    </div>
  )
}