export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startDailyWeatherScheduler } = await import("@/lib/scheduler/dailyWeatherJob");
    startDailyWeatherScheduler();
  }
}
