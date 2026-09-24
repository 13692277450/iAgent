// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { installRemoteLogger } = await import("@/lib/remote_logger");
    installRemoteLogger();
  }
}
