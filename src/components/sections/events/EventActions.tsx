"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { buildIcs, directionsUrl, eventPageUrl, googleCalendarUrl, type CalendarEvent } from "@/lib/events/calendar";
import { copyText } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils/cn";

type EventActionsProps = {
  event: CalendarEvent & {
    status: "upcoming" | "past" | "tba";
    format: "in-person" | "online" | "hybrid";
    calendarReady: boolean;
    registrationUrl?: string;
    moreInfoUrl?: string;
    mapUrl?: string;
  };
  /** Canonical site URL (NEXT_PUBLIC_SITE_URL) — used for calendar and share links. */
  siteUrl: string;
};

const primary =
  "inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-plum-950 shadow-card transition-[background-color,scale] hover:bg-plum-100 active:scale-[0.97]";
const secondary =
  "inline-flex min-h-12 items-center gap-2 rounded-full bg-white/12 px-5 text-sm font-semibold text-white ring-1 ring-white/15 ring-inset transition-[background-color,scale] hover:bg-white/20 active:scale-[0.97]";

const hostOf = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "another website";
  }
};

/**
 * Event actions — each appears only when the event's data supports it.
 * Registration always links to the external service the church uses; the
 * website never takes or confirms registrations itself.
 */
export function EventActions({ event, siteUrl }: EventActionsProps) {
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "failed">("idle");
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const upcoming = event.status !== "past";
  const pageUrl = eventPageUrl(siteUrl, event.slug);

  const google = event.calendarReady && upcoming ? googleCalendarUrl(event, siteUrl) : undefined;
  const directions = event.format !== "online" ? directionsUrl(event) : undefined;
  const watchOnline = event.format !== "in-person" && upcoming ? event.onlineUrl : undefined;

  const downloadIcs = () => {
    const ics = buildIcs(event, siteUrl);
    if (!ics) return;
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.slug}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    detailsRef.current?.removeAttribute("open");
  };

  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: event.title, text: event.summary, url: pageUrl });
        return;
      } catch (error) {
        // The visitor closed the share sheet — not an error, do nothing.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    const ok = await copyText(pageUrl);
    setShareStatus(ok ? "copied" : "failed");
    window.setTimeout(() => setShareStatus("idle"), ok ? 3000 : 6000);
  };

  const closeOnEscape = (keyEvent: KeyboardEvent<HTMLDetailsElement>) => {
    if (keyEvent.key === "Escape" && detailsRef.current?.open) {
      detailsRef.current.removeAttribute("open");
      detailsRef.current.querySelector("summary")?.focus();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {event.registrationUrl && upcoming && (
          <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className={primary}>
            Register <Icon name="arrowUpRight" size={16} />
            <span className="sr-only">(on {hostOf(event.registrationUrl)}, opens in a new tab)</span>
          </a>
        )}

        {google && (
          <details ref={detailsRef} className="relative" onKeyDown={closeOnEscape}>
            <summary className={cn(event.registrationUrl ? secondary : primary, "cursor-pointer list-none [&::-webkit-details-marker]:hidden")}>
              <Icon name="calendar" size={16} /> Add to calendar
            </summary>
            <div className="squircle absolute left-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl bg-white p-1.5 text-plum-950 shadow-float">
              <a
                href={google}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold hover:bg-plum-50"
              >
                Google Calendar <Icon name="arrowUpRight" size={14} className="ml-auto text-plum-400" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <button
                type="button"
                onClick={downloadIcs}
                className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold hover:bg-plum-50"
              >
                Apple, Outlook & others (.ics)
              </button>
            </div>
          </details>
        )}

        {watchOnline && (
          <a href={watchOnline} target="_blank" rel="noopener noreferrer" className={secondary}>
            <Icon name="play" size={14} /> Watch online
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}

        {directions && (
          <a href={directions} target="_blank" rel="noopener noreferrer" className={secondary}>
            <Icon name="mapPin" size={16} /> Get directions
            <span className="sr-only">(opens maps in a new tab)</span>
          </a>
        )}

        {event.moreInfoUrl && (
          <a href={event.moreInfoUrl} target="_blank" rel="noopener noreferrer" className={secondary}>
            More information <Icon name="arrowUpRight" size={16} />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}

        <button type="button" onClick={share} className={secondary}>
          <Icon name={shareStatus === "copied" ? "check" : "link"} size={16} />
          {shareStatus === "copied" ? "Link copied" : "Share event"}
        </button>
      </div>

      <p role="status" aria-live="polite" className={cn("mt-3 text-sm text-plum-200", shareStatus === "idle" && "sr-only")}>
        {shareStatus === "copied"
          ? "Event link copied to your clipboard."
          : shareStatus === "failed"
            ? `Couldn’t copy automatically — the link is ${pageUrl}`
            : ""}
      </p>
      {event.registrationUrl && upcoming && (
        <p className="mt-2 text-xs text-plum-300">Registration is handled on {hostOf(event.registrationUrl)}.</p>
      )}
      {upcoming && !event.calendarReady && event.date && (
        <p className="mt-2 text-xs text-plum-300">An end time hasn’t been published yet, so calendar export isn’t available.</p>
      )}
    </div>
  );
}
