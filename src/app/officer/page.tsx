import { getComplaints } from "@/lib/db";
import OfficerClient from "@/components/OfficerClient";

export const revalidate = 0;

export default async function OfficerPage() {
  const complaints = await getComplaints();

  return <OfficerClient complaints={complaints} />;
}
