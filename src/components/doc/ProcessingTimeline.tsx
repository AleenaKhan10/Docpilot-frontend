import { CheckCircle2, Loader2 } from "lucide-react";
import type { VideoProgressEvent } from "../../lib/use-video-progress";

/**
 * The pipeline stages we want to visualize. Order matters — the timeline
 * marks earlier ones as done once a later one fires.
 */
const STAGES: { key: string; label: string }[] = [
  { key: "splitting", label: "Extracting audio + frames" },
  { key: "transcribing", label: "Transcribing audio" },
  { key: "generating", label: "Writing structured document" },
  { key: "saving", label: "Saving to database" },
  { key: "generating_pdf", label: "Rendering PDF" },
];

const STAGE_INDEX: Record<string, number> = {
  started: -1,
  splitting: 0,
  transcribing: 1,
  generating: 2,
  saving: 3,
  generating_pdf: 4,
  completed: 5,
  failed: -2,
};

interface ProcessingTimelineProps {
  event: VideoProgressEvent | null;
  connected: boolean;
  error: string | null;
}

const ProcessingTimeline = ({ event, connected, error }: ProcessingTimelineProps) => {
  const currentIndex = event ? STAGE_INDEX[event.status] ?? -1 : -1;
  const progress = event?.progress ?? 0;

  return (
    <div>
      {/* Progress bar */}
      <div className="h-[3px] bg-s3 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-info-fg transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stage list */}
      <div className="flex flex-col gap-2">
        {STAGES.map((s, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 size={13} className="text-ok-fg" />
                ) : isActive ? (
                  <Loader2 size={13} className="text-info-fg animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-l3" />
                )}
              </div>
              <div
                className={[
                  "text-[12px]",
                  isDone ? "text-t4" : isActive ? "text-t1 font-medium" : "text-t5",
                ].join(" ")}
              >
                {s.label}
              </div>
              {isActive && event?.message && (
                <div className="font-mono text-[10px] text-t5 ml-auto truncate">
                  {event.message}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-l1 flex items-center justify-between font-mono text-[10px]">
        <span className="text-t5">
          {error ? (
            <span className="text-err-fg">{error}</span>
          ) : connected ? (
            <span className="text-ok-fg">Live · connected</span>
          ) : (
            <span className="text-t5">Reconnecting…</span>
          )}
        </span>
        <span className="text-t3">{progress}%</span>
      </div>
    </div>
  );
};

export default ProcessingTimeline;
