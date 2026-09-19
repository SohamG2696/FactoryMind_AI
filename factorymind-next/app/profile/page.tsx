import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "FactoryMind AI — My Profile · AI Activity",
  description:
    "Personal profile page with the AI's live decision feed, open missions, and audit log — grounded in real Mongo state.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
