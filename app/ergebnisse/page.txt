export default function ErgebnissePage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <iframe
          src="https://www.fussball.de/spieltagsuebersicht/bezirksliga-bezirk-oberschwaben-bezirksliga-herren-saison2627-wuerttemberg/-/staffel/0319U1GHVS000006VS5489BTVSK8S3O6-G#!/"
          style={{
            width: '150%',
            height: '150%',
            border: 'none',
            marginLeft: '-15%',
            marginTop: '-20%',
            position: 'absolute',
          }}
        />
      </div>
    </div>
  )
}