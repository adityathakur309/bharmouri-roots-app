import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-amber-700 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold">Sign in required</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
          You need to be signed in to view this page. Please log in to continue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/login">
            <Button className="w-full sm:w-auto min-h-11">Sign in</Button>
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
