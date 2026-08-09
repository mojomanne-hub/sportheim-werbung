export default function SpielPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#000',
    }}>
      <iframe
        src="https://www.fussball.de/spiel/tsv-kirchberg-iller-fv-biberach/-/spiel/031DQTTCB4000000VS5489BUVUR5FS5A#!/"
        style={{
          width: '150%',
          height: '150%',
          border: 'none',
          marginLeft: '-15%',
          marginTop: '-12%',
        }}
      />
    </div>
  )
}