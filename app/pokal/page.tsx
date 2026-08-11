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
     src="https://www.fussball.de/spieltag/1-runde-bezirk-oberschwaben-bezirkspokal-herren-saison2627-wuerttemberg/-/spieldatum/2026-08-11/staffel/030TM3AU50000001VS5489BUVSEBP30S-R#!/"

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