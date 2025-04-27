import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "GoDigital - Dashboard",
  description: "",
};

export default async function Home() {
  redirect("/");
}
