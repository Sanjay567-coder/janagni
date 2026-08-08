import { getComplaintById } from "@/lib/db";
import ResolutionClient from "@/components/ResolutionClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

export const revalidate = 0;

export default async function ResolutionPage({ params }: PageProps) {
  const complaint = await getComplaintById(params.id);

  if (!complaint) {
    notFound();
  }

  return <ResolutionClient complaint={complaint} />;
}
