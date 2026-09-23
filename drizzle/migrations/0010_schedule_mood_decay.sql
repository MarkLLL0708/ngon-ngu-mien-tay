CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'companion-mood-decay',
  '0 19 * * *',
  $$SELECT public.decay_companion_emotional_state();$$
);