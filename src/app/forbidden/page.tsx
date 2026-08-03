import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
          You don&apos;t have permission to view this page. If you believe this is a mistake, contact an administrator.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/dashboard">
            <Button className="w-full sm:w-auto min-h-11">My account</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto min-h-11">
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
