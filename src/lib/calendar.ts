/**
 * calendar.ts - Browser-side ICS file generation
 */

export function generateICS(title: string, deadline: string, description?: string): string {
  const dt = new Date(deadline);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtDate = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;

  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SATURNX//Scheme Deadline//EN",
    "BEGIN:VEVENT",
    `UID:saturnx-${Date.now()}@scheme-finder`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${fmtDate(dt)}`,
    `DTEND;VALUE=DATE:${fmtDate(dt)}`,
    `SUMMARY:${title} - Application Deadline`,
    `DESCRIPTION:${description ?? "SATURNX scheme application deadline reminder"}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder - ${title} deadline is in 7 days`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadICS(title: string, deadline: string): void {
  const ics = generateICS(title, deadline);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_deadline.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
