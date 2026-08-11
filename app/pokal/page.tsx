export default function PokalPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#fff',
    }}>
      <iframe
        src="https://www.fussball.de/spieltag/1-runde-bezirk-oberschwaben-bezirkspokal-herren-saison2627-wuerttemberg/-/spieldatum/2026-08-11/staffel/030TM3AU50000001VS5489BUVSEBP30S-R#!/"
        style={{
          width: '120%',
          height: '400%',
          border: 'none',
          marginTop: '-1200px',
          marginLeft: '-15px',
        }}
      />
    </div>
  )
}