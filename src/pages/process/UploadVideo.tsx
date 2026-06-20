import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, FileVideo, Loader2, Upload, X } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Pill from "../../components/ui/Pill";
import { useOrg } from "../../contexts/OrgContext";
import { ApiError, uploadFile } from "../../lib/api";
import type { DocOutputType } from "../../lib/doc-types";
import type { BackendVideoSummary } from "../../lib/video-types";

const OUTPUT_TYPES: { value: DocOutputType; label: string; desc: string; featured?: boolean }[] = [
  { value: "sop", label: "SOP", desc: "Sectioned, hierarchical procedure with decision points and callouts.", featured: true },
  { value: "bug_report", label: "Bug Report", desc: "Repro steps + expected vs. actual + environment, captured automatically." },
  { value: "training", label: "Training Module", desc: "Lesson sequence with embedded comprehension checks." },
  { value: "changelog", label: "Changelog", desc: "Versioned list of new / fixed / improved / breaking changes." },
  { value: "audit", label: "Audit Trail", desc: "Timestamped actor → action log, categorized." },
  { value: "client_handover", label: "Client Handover", desc: "Deliverables checklist and project closeout summary." },
];

const fmtBytes = (b: number) => {
  const mb = b / 1_000_000;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(b / 1000).toFixed(0)} KB`;
};

type UploadStage = "idle" | "uploading" | "finalizing" | "done" | "failed";

const UploadVideo = () => {
  const { activeOrg } = useOrg();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [outputType, setOutputType] = useState<DocOutputType>("sop");

  // Guests cannot create new documents — bounce them to the dashboard
  // before they fill out the form. The backend also enforces this on
  // POST /videos via RequireRole, but this saves a wasted upload.
  useEffect(() => {
    if (!activeOrg) return;
    const role = activeOrg.role;
    const canUpload = role === "owner" || role === "admin" || role === "member";
    if (!canUpload) navigate("/", { replace: true });
  }, [activeOrg, navigate]);

  // Allow ?type=sop|training|bug_report|... to pre-select an output type
  // (used by dashboard quick-action cards).
  useEffect(() => {
    const t = searchParams.get("type");
    if (
      t &&
      ["sop", "training", "bug_report", "changelog", "audit", "client_handover"].includes(t)
    ) {
      setOutputType(t as DocOutputType);
    }
  }, [searchParams]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  const acceptFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      setError("Please choose a video file (MP4, MOV, or WebM).");
      return;
    }
    setError("");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    setStage("idle");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;

    setStage("uploading");
    setProgress(0);
    setError("");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("file", file);
    fd.append("output_type", outputType);
    if (description.trim()) {
      fd.append("description", description.trim());
    }

    try {
      const created = await uploadFile<BackendVideoSummary>(
        "/api/v1/videos/",
        fd,
        (pct) => {
          setProgress(pct);
          if (pct >= 100) setStage("finalizing");
        }
      );
      setStage("done");
      // brief pause so the user sees the success state
      setTimeout(() => navigate(`/documents/${created.id}`), 600);
    } catch (err) {
      setStage("failed");
      setError(err instanceof ApiError ? err.detail : "Upload failed. Try again.");
    }
  };

  const isBusy = stage === "uploading" || stage === "finalizing" || stage === "done";

  return (
    <MainLayout breadcrumbs={[{ label: activeOrg?.name ?? "Workspace" }, { label: "Generate" }]}>
      <div className="px-6 py-6 max-w-[1100px] mx-auto">
        <div className="mb-6">
          <h1 className="text-[20px] font-semibold tracking-tight text-white">Generate document</h1>
          <p className="text-[12px] text-t4 mt-0.5">
            Pick an output type, upload a screen recording, and DocPilot will produce a structured document — not just a step list.
          </p>
        </div>

        {/* Output type picker */}
        <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-t5 mb-2.5">
          1 — Choose output type
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
          {OUTPUT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setOutputType(t.value)}
              disabled={isBusy}
              className={[
                "bg-s1 border rounded-md p-4 text-left transition relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed",
                outputType === t.value
                  ? "border-white bg-s3"
                  : t.featured
                  ? "border-l3 hover:bg-s2 hover:border-l3"
                  : "border-l1 hover:bg-s2 hover:border-l3",
              ].join(" ")}
            >
              {(outputType === t.value || t.featured) && (
                <div
                  className={[
                    "absolute top-0 left-0 right-0 h-px",
                    outputType === t.value ? "bg-white" : "bg-t2",
                  ].join(" ")}
                />
              )}
              <div className="text-[12px] font-semibold text-t1 mb-1.5">{t.label}</div>
              <div className="text-[11px] text-t4 leading-[1.55]">{t.desc}</div>
              {outputType === t.value && (
                <div className="mt-2.5">
                  <Pill variant="info">Selected</Pill>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Upload zone */}
        <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-t5 mb-2.5">
          2 — Upload source video
        </div>
        <div
          onDragEnter={onDrag}
          onDragOver={onDrag}
          onDragLeave={onDrag}
          onDrop={onDrop}
          className={[
            "border border-dashed rounded-md p-9 text-center transition mb-6",
            isBusy ? "cursor-not-allowed" : "cursor-pointer",
            dragActive
              ? "border-l4 bg-s2"
              : file
              ? "border-l3 bg-s1"
              : "border-l2 hover:border-l4 hover:bg-s2",
          ].join(" ")}
          onClick={() => !file && !isBusy && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) acceptFile(f);
            }}
          />
          {!file ? (
            <>
              <div className="w-9 h-9 mx-auto bg-s2 border border-l2 rounded-md flex items-center justify-center mb-3">
                <Upload size={16} className="text-t3" />
              </div>
              <div className="text-[13px] font-medium text-t1 mb-1">
                Drop a video here, or click to browse
              </div>
              <div className="text-[11px] text-t5">
                MP4, MOV, WebM · Up to 500 MB
              </div>
            </>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-3 bg-s2 border border-l2 rounded-md p-3">
                <div className="w-10 h-10 rounded-md bg-s3 border border-l2 flex items-center justify-center flex-shrink-0">
                  {stage === "done" ? (
                    <CheckCircle2 size={18} className="text-ok-fg" />
                  ) : stage === "uploading" || stage === "finalizing" ? (
                    <Loader2 size={18} className="text-info-fg animate-spin" />
                  ) : (
                    <FileVideo size={18} className="text-t2" />
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-t2 truncate">{file.name}</div>
                  <div className="font-mono text-[10px] text-t5 mt-0.5">
                    {fmtBytes(file.size)}
                  </div>
                </div>
                {!isBusy && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="w-7 h-7 rounded-sm border border-l2 text-t5 hover:bg-s3 hover:text-err-fg transition flex items-center justify-center"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {(stage === "uploading" || stage === "finalizing" || stage === "done") && (
                <div className="mt-3">
                  <div className="h-1 bg-s3 rounded-full overflow-hidden">
                    <div
                      className={[
                        "h-full transition-all duration-200",
                        stage === "done" ? "bg-ok-fg" : "bg-info-fg",
                      ].join(" ")}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 font-mono text-[10px] text-t5">
                    <span>
                      {stage === "uploading"
                        ? "Uploading…"
                        : stage === "finalizing"
                        ? "Queueing for processing…"
                        : "Done — opening document…"}
                    </span>
                    <span>{progress}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-t5 mb-2.5">
          3 — Add details
        </div>
        <div className="bg-s1 border border-l1 rounded-md p-5 flex flex-col gap-4 mb-6">
          <Input
            label="Title"
            placeholder="e.g. Onboarding a new freight client"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isBusy}
          />
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-t5">
              Context (optional)
            </label>
            <textarea
              className="w-full min-h-[100px] rounded-sm bg-s2 border border-l1 text-t1 text-[13px] p-3 leading-relaxed outline-none focus:border-l3 placeholder:text-t5 resize-y disabled:opacity-50"
              placeholder="Audience, tone, anything the AI should know about your team's conventions."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isBusy}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-sm border border-err-line bg-err-bg/40 px-3.5 py-2.5 font-mono text-[10px] text-err-fg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-5 border-t border-l1">
          <Button variant="ghost" onClick={removeFile} disabled={isBusy}>
            Reset
          </Button>
          <Button
            variant="primary"
            disabled={!file || !title.trim() || isBusy}
            onClick={handleSubmit}
          >
            {stage === "uploading"
              ? `Uploading ${progress}%`
              : stage === "finalizing"
              ? "Queueing…"
              : stage === "done"
              ? "Done"
              : "Generate document"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default UploadVideo;
