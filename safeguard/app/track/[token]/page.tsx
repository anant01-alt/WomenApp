import { TrackViewer } from "./track-viewer";

export const dynamic = "force-dynamic";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <TrackViewer token={token} />;
}
