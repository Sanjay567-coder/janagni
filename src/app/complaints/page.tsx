import { getComplaints } from "@/lib/db";
import ComplaintsClient from "@/components/ComplaintsClient";

export const revalidate = 0;

export default async function ComplaintsPage() {
  const complaints = await getComplaints();

  return <ComplaintsClient initialComplaints={complaints} />;
}
