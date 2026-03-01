import SessionExplorer from '@/components/SessionExplorer';

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Session Explorer</h2>
        <p className="text-sm text-muted-foreground">
          Browse individual customer sessions and their journeys
        </p>
      </div>
      <SessionExplorer />
    </div>
  );
}
