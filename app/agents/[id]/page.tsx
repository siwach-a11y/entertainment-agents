import { agents } from "@/lib/data/agents";
import AgentPageClient from "./AgentPageClient";

export function generateStaticParams() {
  return agents.map((agent) => ({ id: agent.id }));
}

export default function AgentPage({ params }: { params: { id: string } }) {
  return <AgentPageClient id={params.id} />;
}
