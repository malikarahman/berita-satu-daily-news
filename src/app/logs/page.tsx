import { LogPage } from "@/components/LogPage";
import { AppShell } from "@/components/layout/AppShell";

export default function Logs() {
  return (
    <AppShell
      title="Log Page"
      subtitle="Pantau log generation, editorial workflow, dan error runtime dari satu tempat."
    >
      <LogPage />
    </AppShell>
  );
}
