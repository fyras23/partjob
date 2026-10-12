export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startPostModerationWorker } = await import("./lib/postModerationQueue");
  startPostModerationWorker();
}