import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useTheme, type ThemeMode } from "@/lib/theme";

export const Route = createFileRoute("/theme-test")({
  component: () => {
    const { mode, setMode } = useTheme();
    return (
      <AppShell title="Theme test">
        <div className="grid grid-cols-3 gap-2 pt-6">
          {(["light", "dark", "system"] as ThemeMode[]).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} data-testid={`t-${m}`}>
              {m} {mode === m ? "*" : ""}
            </button>
          ))}
        </div>
      </AppShell>
    );
  },
});
