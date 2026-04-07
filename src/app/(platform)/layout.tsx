import { getPlatformServerUser } from "@/lib/supabase/server-user";
import { PlatformLayoutClient } from "./platform-layout-client";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serverUser = await getPlatformServerUser();

  return <PlatformLayoutClient serverUser={serverUser}>{children}</PlatformLayoutClient>;
}
