import { AppShell } from "@/components/layout/AppShell";
import { ArticleDashboard } from "@/components/ArticleDashboard";

export default function Home() {
  return (
    <AppShell
      title="Berita Satu: Cuaca Hari Ini"
      subtitle="Pantau article draft BMKG, jalankan manual generation, dan kelola review editorial dari satu dashboard."
    >
      <ArticleDashboard />
    </AppShell>
  );
}
