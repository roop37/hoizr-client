export type SwiggyConnectionSnapshot = {
  connected: boolean;
  status?: string | null;
};

export type SwiggyConnectionView =
  | "loading"
  | "error"
  | "connect"
  | "reconnect"
  | "connected";

export function getSwiggyConnectionView(
  snapshot: SwiggyConnectionSnapshot | null,
  failed: boolean
): SwiggyConnectionView {
  if (failed) return "error";
  if (!snapshot) return "loading";
  if (snapshot.connected) return "connected";
  if (snapshot.status) return "reconnect";
  return "connect";
}
