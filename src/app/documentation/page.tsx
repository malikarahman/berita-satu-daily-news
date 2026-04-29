import { DocumentationPage } from "@/components/DocumentationPage";
import { AppShell } from "@/components/layout/AppShell";

export default function Documentation() {
  return (
    <AppShell
      title="Documentation"
      subtitle="Panduan end-to-end untuk editor dan developer yang mengelola workflow Berita Satu: Cuaca Hari Ini."
    >
      <DocumentationPage />
    </AppShell>
  );
}
