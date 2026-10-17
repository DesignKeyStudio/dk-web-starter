import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

// Next.js 16 renamed the `middleware` file convention to `proxy` (it always runs on Node.js).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|storybook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|json|txt)$).*)",
  ],
};
