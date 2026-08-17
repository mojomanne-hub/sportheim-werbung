export default function SpielplanPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#fff',
    }}>
      <iframe
  src="https://www.fussball.de/spieltagsuebersicht/kreisliga-b2-bezirk-oberschwaben-k-kreisliga-b-herren-saison2627-wuerttemberg/-/staffel/031B7GLNS0000006VS5489BUVV628VP4-G#!/"
  style={{
    width: '100%',
    height: '200%',
    border: 'none',
    marginTop: '-600px',    // ← Statt -200px, weiter runter
    marginLeft: '10px',   // ← Neu, nach rechts verschieben
  }}
/>
    </div>
  )
}