const sections = [
  {
    id: "overview",
    title: "Ikhtisar Sistem",
    body: [
      "Berita Satu: Cuaca Hari Ini adalah dashboard internal untuk memantau, membuat, dan mereview artikel prakiraan cuaca berbasis BMKG.",
      "Pipeline inti sistem tetap satu jalur: location selection resolver -> BMKG fetcher -> BMKG normalizer -> aggregator -> template selector -> article generator -> database save -> activity log."
    ]
  },
  {
    id: "manual",
    title: "Run Article",
    body: [
      "Run Article dipakai untuk custom generation. Editor memilih cakupan artikel, template preference, dan editor penanggung jawab, lalu sistem membuat satu draft artikel berstatus Pending Review.",
      "Cakupan yang didukung meliputi single region, multiple publication areas, multiple regions, dan all region: Jabodetabek."
    ]
  },
  {
    id: "batch",
    title: "Automated Generate Articles",
    body: [
      "Sistem tidak lagi berjalan otomatis pada pukul 05.00 WIB. Batch generation sekarang dipicu manual melalui tombol Automated Generate Articles di dashboard.",
      "Saat tombol dikonfirmasi, sistem membuat artikel untuk Jakarta, Bogor, Depok, Tangerang, Bekasi, dan Jabodetabek. Semua hasil batch masuk ke dashboard dengan run type Automated Manual dan status Pending Review."
    ]
  },
  {
    id: "coverage",
    title: "Cakupan Wilayah",
    body: [
      "Location yang tampil di UI berada pada level kota, kabupaten, atau kota administrasi. Publication areas seperti Jakarta Selatan, Kota Bogor, dan Kabupaten Bekasi dipakai sebagai unit editorial yang bisa dibaca redaksi.",
      "BMKG tetap diakses lewat lokasi representatif adm4 di belakang layar. Kelurahan atau desa hanya dipakai sebagai sumber data internal, tidak diekspos ke editor."
    ]
  },
  {
    id: "bmkg",
    title: "BMKG dan Normalisasi Data",
    body: [
      "Sumber utama sistem adalah https://cuaca.bmkg.go.id/ dan endpoint prakiraan BMKG berbasis adm4. Setiap publication area dirangkum menjadi satu normalized weather object sebelum dipakai oleh generator.",
      "Untuk region besar atau Jabodetabek, beberapa publication areas digabung lagi menjadi satu ringkasan regional. Jika sebagian sumber BMKG gagal, sistem tetap bisa menghasilkan artikel selama data minimum masih tersedia, lalu menaruh konteksnya di Catatan Redaksi."
    ]
  },
  {
    id: "templates",
    title: "Logika Template",
    body: [
      "Template tidak terikat lokasi. Sistem memilih pola editorial berdasarkan jenis cakupan, jumlah area, struktur waktu, variasi hujan, dan sinyal risiko.",
      "Single region dengan breakdown area biasanya memakai pola area-based penuh. Multiple regions atau Jabodetabek cenderung memakai pola overview lintas region. Editor juga tetap bisa melakukan template override secara manual."
    ]
  },
  {
    id: "workflow",
    title: "Workflow Editorial",
    body: [
      "Semua artikel baru masuk dengan status Pending Review. Editor dapat mengubah status ke Approved, Revision Needed, Rejected, atau tetap menyimpannya di antrean review.",
      "Generated Article Body dapat diedit langsung dari draft view. Catatan Redaksi dipisahkan dari Catatan agar konteks sistem dan catatan editor tidak bercampur."
    ]
  },
  {
    id: "logs",
    title: "Logs dan Error Handling",
    body: [
      "Halaman Logs menggabungkan activity log dan error log sehingga batch generate, BMKG fetch, template selection, update status, edit body, dan update catatan dapat dilacak dari satu tempat.",
      "Stack trace mentah tidak ditampilkan ke editor di dashboard. Detail teknis tetap disimpan di error_logs untuk kebutuhan debugging."
    ]
  },
  {
    id: "future",
    title: "Integrasi Lanjutan",
    body: [
      "Versi ini berhenti di tahap editorial review dan belum mengirim artikel ke CMS. Approved berarti artikel siap untuk integrasi lanjutan, bukan otomatis tayang.",
      "Struktur data dan payload cuaca tetap disimpan agar integrasi ke Google Docs, CMS, analytics, atau role-based access bisa ditambahkan tanpa mengganti pipeline inti."
    ]
  }
];

export function DocumentationPage() {
  return (
    <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-6">
      <aside className="sticky top-6 h-fit rounded-md border border-newsroom-line bg-white p-4 shadow-subtle">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">Documentation</div>
        <div className="mt-3 space-y-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="block rounded-md px-3 py-2 text-sm font-medium text-newsroom-ink hover:bg-newsroom-surface"
            >
              {section.title}
            </a>
          ))}
        </div>
      </aside>

      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="rounded-md border border-newsroom-line bg-white p-6 shadow-subtle">
            <h2 className="text-lg font-semibold text-newsroom-ink">{section.title}</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-newsroom-muted">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
