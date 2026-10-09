CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('swapcoin-rating-reminders', '0 * * * *', $$SELECT public.send_rating_reminders()$$);