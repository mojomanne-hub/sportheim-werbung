export default function PokalPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',  // ← Wichtig! Schneidet alles ab was übersteht
      background: '#fff',
    }}>
      <iframe
        src="https://www.fussball.de/spieltagsuebersicht/wfv-pokal-gruppe-1-runde-1-3-herren-saison2627-wuerttemberg/-/staffel/POKALG1R1-3HERREN2627WBTVSK8S3O6-G#!/"
        style={{
          width: '120%',      // ← Exotischer: 120% statt 100/200
          height: '220%',     // ← Exotischer: 140% statt 200
          border: 'none',
          marginTop: '-1200px',
          marginLeft: '0px',
        }}
      />
    </div>
  )
}