import Script from 'next/script'

export default function ErgebnissePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div
          className="fussballde_widget"
          data-id="2579f34a-aa3b-4d08-b63b-3ebacade4e12"
          data-type="table"
          style={{ width: '100%' }}
        />
      </div>

      <Script
        src="https://www.fussball.de/widgets.js"
        strategy="afterInteractive"
      />
    </div>
  )
}