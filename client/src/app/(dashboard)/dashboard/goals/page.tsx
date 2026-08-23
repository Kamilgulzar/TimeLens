import { Card, CardContent } from "@/components/ui/card";

export default function GoalsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Goals
        </h1>
        <p className="mt-1 text-muted-foreground">
          Set and track your productivity goals.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            This section is coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}