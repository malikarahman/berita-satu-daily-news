import cron from "node-cron";
import { runScheduledArticles } from "@/lib/articles/service";
import { logSystemError } from "@/lib/db/systemLog";

let started = false;

export function startDailyWeatherScheduler() {
  if (started || process.env.SCHEDULE_ENABLED !== "true") return;

  const expression = process.env.SCHEDULE_CRON ?? "0 5 * * *";
  const timezone = process.env.SCHEDULE_TIMEZONE ?? "Asia/Jakarta";

  cron.schedule(
    expression,
    async () => {
      try {
        const articles = await runScheduledArticles();
        console.info(`Scheduled weather generation completed: ${articles.length} articles`);
      } catch (error) {
        console.error("Scheduled weather generation failed", error);
        await logSystemError("scheduler:daily-weather", error);
      }
    },
    { timezone }
  );

  started = true;
  console.info(`Daily weather scheduler started with "${expression}" (${timezone})`);
}
