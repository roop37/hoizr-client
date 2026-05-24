import { eventsRssResponse } from "@/lib/rss";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

export function GET() {
  return eventsRssResponse("/feed.xml");
}
