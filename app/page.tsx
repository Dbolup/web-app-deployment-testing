import { redirect } from "next/navigation";

export default function Home() {
  // The root path has no UI of its own — send users to the dashboard.
  redirect("/dashboard");
}
