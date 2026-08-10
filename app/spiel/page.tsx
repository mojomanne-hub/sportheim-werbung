export default function SpielPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#000',
    }}>
      <iframe
        src="https://www.fussball.de/spieltagsuebersicht/kreisliga-b2-bezirk-oberschwaben-k-kreisliga-b-herren-saison2627-wuerttemberg/-/staffel/031B7GLNS0000006VS5489BUVV628VP4-G#!/"
        style={{
          width: '150%',
          height: '150%',
          border: 'none',
          marginLeft: '-25%',
          marginTop: '-25%',
        }}
      />
    </div>
  )
}