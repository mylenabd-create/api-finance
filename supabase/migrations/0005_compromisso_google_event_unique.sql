-- Permite upsert por google_event_id ao sincronizar com o Google Calendar.
create unique index compromisso_conta_google_event_idx
  on compromisso (conta_id, google_event_id)
  where google_event_id is not null;
