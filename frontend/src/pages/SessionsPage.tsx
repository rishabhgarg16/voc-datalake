import SessionExplorer from '@/components/SessionExplorer';

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Session Explorer</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Browse individual customer sessions and drill into journey timelines
        </p>
      </div>
      <SessionExplorer />
    </div>
  );
}
