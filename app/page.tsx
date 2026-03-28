import { redirect } from "next/navigation";

// Root redirects to the signal dashboard
export default function HomePage() {
  redirect("/dashboard");
}
