export default function SpielplanPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#fff',
    }}>
      <div style={{
        width: '5%',
        height: '5%',
        marginLeft: '-5%',
        marginTop: '-5%',
      }}>
        <iframe
          src="https://www.fussball.de/spieltagsuebersicht/bezirksliga-bezirk-oberschwaben-bezirksliga-herren-saison2627-wuerttemberg/-/staffel/0319U1GHVS000006VS5489BTVSK8S3O6-G#!/"
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