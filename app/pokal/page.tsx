export default function PokalPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#fff',
      position: 'relative',
    }}>
      <iframe
        src="https://www.fussball.de/spieltagsuebersicht/wfv-pokal-gruppe-1-runde-1-3-herren-saison2627-wuerttemberg/-/staffel/POKALG1R1-3HERREN2627WBTVSK8S3O6-G#!/"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </div>
  )
}