import { getComplaints, getComplaintById } from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";

interface PageProps {
  searchParams: {
    id?: string;
  };
}

export const revalidate = 0; // Disable caching to ensure Firestore updates reflect immediately

export default async function Page({ searchParams }: PageProps) {
  const complaints = await getComplaints();
  
  // Find current complaint based on query param, or default to the most recent one
  let selectedComplaint = null;
  if (searchParams.id) {
    selectedComplaint = await getComplaintById(searchParams.id);
  } else if (complaints.length > 0) {
    selectedComplaint = complaints[0];
  }

  return (
    <DashboardClient 
      initialComplaint={selectedComplaint} 
      complaintsCount={complaints.length} 
    />
  );
}
