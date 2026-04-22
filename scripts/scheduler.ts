import { startDailyWeatherScheduler } from "../src/lib/scheduler/dailyWeatherJob";

process.env.SCHEDULE_ENABLED = process.env.SCHEDULE_ENABLED ?? "true";
startDailyWeatherScheduler();

console.info("Scheduler process is running. Press Ctrl+C to stop.");
