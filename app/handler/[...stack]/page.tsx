import { redirect } from "next/navigation";

export default async function LegacyAuthHandler({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const login = new URLSearchParams();
  if (typeof params.invite === "string") login.set("invite", params.invite);
  redirect(`/login${login.size ? `?${login.toString()}` : ""}`);
}
