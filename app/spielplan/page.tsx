export default function SpielplanPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#fff',
    }}>
      <div style={{
        width: '120%',
        height: '120%',
        marginLeft: '-0%',
        marginTop: '-5%',
      }}>
        <iframe
          src="https://sportheim-werbung.vercel.app/widget/df2f6bf0-ec97-4a69-9a6d-9efee44fac96"
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