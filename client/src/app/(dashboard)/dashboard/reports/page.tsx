import { Card, CardContent } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Reports
        </h1>
        <p className="mt-1 text-muted-foreground">
          Generate and export detailed time reports.
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