// Cliente mínimo da Google Calendar API — usa fetch direto (sem SDK) já que
// só precisamos de "renovar token" e "listar eventos".

export interface GoogleTokenSet {
  accessToken: string;
  expiresAt: Date;
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenSet> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados no .env.local");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    throw new Error(`falha ao renovar token do Google (${res.status}): ${detalhe}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  status?: string;
}

export async function listGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<GoogleCalendarEvent[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set("timeMin", timeMin.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    throw new Error(`falha ao listar eventos do Google Calendar (${res.status}): ${detalhe}`);
  }

  const data = (await res.json()) as { items?: GoogleCalendarEvent[] };
  return data.items ?? [];
}
