import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Redirect to user's preferred home page
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { homePage: true },
    }).catch(() => null);
    redirect(profile?.homePage ?? "/dashboard");
  } else {
    redirect("/login");
  }
}
