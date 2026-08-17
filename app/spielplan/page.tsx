export default function SpielplanPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#fff',
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '20px',
        color: '#666',
        zIndex: 1,
      }}>
        Lädt Spielplan...
      </div>
      
      <iframe
        src="https://www.fussball.de/spieltagsuebersicht/bezirksliga-bezirk-oberschwaben-bezirksliga-herren-saison2627-wuerttemberg/-/staffel/0319U1GHVS000006VS5489BTVSK8S3O6-G#!/"
        style={{
          width: '100%',
          height: '200%',
          border: 'none',
          marginTop: '-400px',
          marginLeft: '-100px',
        }}
      />
    </div>
  )
}