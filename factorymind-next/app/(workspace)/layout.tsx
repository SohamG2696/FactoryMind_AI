import AppShell from "@/components/AppShell";
import { FactorySimProvider } from "@/context/FactorySimContext";

/**
 * Shared shell for the in-app pages (dashboard, simulation, scenario lab,
 * manpower): one sidebar + header, and one running factory simulation that
 * persists across navigation.
 */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <FactorySimProvider>
      <AppShell>{children}</AppShell>
    </FactorySimProvider>
  );
}
