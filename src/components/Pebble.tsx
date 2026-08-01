import React, { useRef, useState, useEffect } from "react";
import { Upload, Pebble as PebbleIcon } from "../assets/Icons.tsx";
import { useAuth } from "../AuthContext.tsx";

type Status =
  | "idle"
  | "uploading"
  | "optimising"
  | "generating"
  | "success"
  | "error";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const STATUS_TEXT: Record<string, { title: string; sub: string }> = {
  uploading: {
    title: "Uploading your resume",
    sub: "Sending your PDF securely & privately…",
  },
  optimising: {
    title: "Optimising with AI",
    sub: "Analysing keywords & rewriting for your target role…",
  },
  generating: {
    title: "Generating your PDF",
    sub: "Laying out your brand new resume…",
  },
  success: {
    title: "Done!",
    sub: "Your optimised resume is downloading…",
  },
};

//  Module-scope timestamp helper — lets us measure elapsed time without
//  tripping the react-hooks "purity" lint that flags Date.now() in components.
const nowMs = (): number => Date.now();

//  Small inline icon used under the Optimise button
const SparkIcon = () => (
  <svg
    className="w-3.5 h-3.5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v2M12 19v2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M3 12h2M19 12h2M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4" />
  </svg>
);

const Pebble: React.FC = () => {
  const uploadRef = useRef<HTMLInputElement>(null);

  //  Keep the progress animation on screen for at least this long so it feels
  //  like a real, substantial optimisation even when the backend is instant.
  const MIN_PROCESS_MS = 7000;
  const timersRef = useRef<number[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const abortToastTimerRef = useRef<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [jobRole, setJobRole] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAbortMsg, setShowAbortMsg] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [viewTemplate, setViewTemplate] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState(false);

  //  Signed-in user — used to name the downloaded file with their account name
  const { user } = useAuth();

  //  Loading overlay shows during processing (+ brief success confirmation)
  const processing = ["uploading", "optimising", "generating"].includes(status);
  const busy = processing || status === "success";

  //  Clear any pending timers and cancel in-flight requests on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      if (abortToastTimerRef.current) clearTimeout(abortToastTimerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  //  Auto-close the success box after a visible 5s countdown
  useEffect(() => {
    if (status !== "success") return;
    let count = 5;
    const interval = window.setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        setStatus("idle");
      } else {
        setCountdown(count);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  //  Fake upload progress bar (uploads are instant, this just feels pleasing)
  useEffect(() => {
    if (status !== "uploading") return;
    const interval = window.setInterval(() => {
      setUploadProgress((p) =>
        Math.min(100, p + Math.floor(Math.random() * 8) + 4)
      );
    }, 110);
    return () => clearInterval(interval);
  }, [status]);

  //  Toggle file upload
  const handleUpload = () => {
    if (busy) return;
    uploadRef.current?.click();
  };

  //  Handle file after upload
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target?.files?.[0];
    //  User cancelled the picker
    if (!file) {
      setFile(null);
      return;
    }
    //  Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File must be under 10MB.");
      setStatus("error");
      e.target.value = "";
      setFile(null);
      return;
    }
    setErrorMsg(null);
    setFileError(false);
    setStatus("idle");
    setFile(file);
  };

  //  Send File to backend to be optimised
  const handlePOST = async () => {
    if (busy) return;
    const startTime = nowMs();

    //  Validation: a resume PDF is required
    if (!file) {
      setFileError(true);
      setErrorMsg("No resume uploaded — please attach a PDF to continue.");
      setStatus("error");
      return;
    }
    setFileError(false);

    //  Job role is optional — when blank we run a simple, general optimisation
    const role = (jobRole ?? "").trim();

    setErrorMsg(null);
    setStatus("uploading");
    setUploadProgress(4);
    hideAbortToast();

    //  Create a cancellable request so closing the box mid-process stops it
    const controller = new AbortController();
    abortRef.current = controller;

    //  Advance the visible stage while we wait for the server
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [
      window.setTimeout(() => setStatus("optimising"), 1200),
      window.setTimeout(() => setStatus("generating"), 3800),
    ];

    try {
      const formData = new FormData();
      formData.append("resumePdf", file);
      formData.append("jobRole", role);

      const response = await fetch(`${API_URL}/optimise`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        let msg = `Request failed (${response.status})`;
        try {
          const err = await response.json();
          if (err?.error) msg = err.error;
        } catch {
          // ignore non-JSON error bodies
        }
        throw new Error(msg);
      }

      //  Keep a consistent, pleasing process pacing even if the server is fast.
      //  Once the real work is done, hold the "Generating" stage a little longer.
      const elapsed = nowMs() - startTime;
      const remaining = MIN_PROCESS_MS - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      //  If the user closed the box while we were pacing, bail out silently.
      if (controller.signal.aborted) return;

      //  Get the file as a blob and trigger the download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      //  Name the file after the signed-in account, e.g. Optimized_Resume_John_Doe.pdf
      const accountName =
        (user?.displayName || user?.email?.split("@")[0] || "user")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .replace(/\s+/g, "_")
          .trim() || "user";
      link.download = `Optimized_Resume_${accountName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setStatus("success");
      setCountdown(5);
    } catch (err) {
      //  User closed the box mid-process -> take the request down silently
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error(err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setStatus("error");
    } finally {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const statusInfo = STATUS_TEXT[status];

  //  Which kind of optimisation are we running? Determines the copy shown in
  //  the progress overlay (a target role => full tailoring, none => simple).
  const targetRole = (jobRole ?? "").trim();
  const mode: "simple" | "full" = targetRole ? "full" : "simple";
  const statusSub =
    status === "optimising"
      ? mode === "full"
        ? `Finding the perfect keywords & tailoring your resume for “${targetRole}”…`
        : "Strengthening your resume for maximum ATS impact…"
      : statusInfo?.sub ?? "";

  //  Abort confirmation toast helpers
  const hideAbortToast = () => {
    if (abortToastTimerRef.current) clearTimeout(abortToastTimerRef.current);
    setShowAbortMsg(false);
  };

  const showAbortToast = () => {
    if (abortToastTimerRef.current) clearTimeout(abortToastTimerRef.current);
    setShowAbortMsg(true);
    abortToastTimerRef.current = window.setTimeout(
      () => setShowAbortMsg(false),
      4000
    );
  };

  //  Dismiss the overlay; if the process is still running, cancel the request too
  const handleClose = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    //  Closing mid-process should stop the in-flight request (no download)
    if (processing) {
      abortRef.current?.abort();
      abortRef.current = null;
      showAbortToast();
    }

    setErrorMsg(null);
    setUploadProgress(0);
    setCountdown(null);
    setStatus("idle");
  };
  return (
    <div className="bg-prl/80 w-[94%] sm:w-[85%] mx-auto h-auto min-h-[22rem] md:h-155 text-txt mt-28 sm:mt-40 pt-5 sm:pt-10 px-4 sm:px-10 pb-6 sm:pb-10 rounded-2xl border border-white/10">
      <div className="flex flex-col md:flex-row justify-between w-full space-y-4 md:space-y-0 md:space-x-4">
        {/* Upload area */}
        <div className="w-full">
          <div
            onClick={handleUpload}
            className={`bg-prd border-2 w-full border-dashed h-36 sm:h-40 md:h-54 pt-4 md:pt-10 rounded-xl ${
              fileError ? "border-red-500/80" : "border-txt/60"
            } ${busy ? "pointer-events-none opacity-50" : "hover:cursor-pointer"}`}
          >
            <input
              ref={uploadRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFile}
              disabled={busy}
            />
            <div className="text-center text-gray-400">
              <Upload className="w-8 h-8 inline-block mb-2" />
              {file ? (
                <div className="flex justify-center items-center">
                  <div className="mt-3 flex text-left bg-prl w-full max-w-[20rem] py-2 px-2 border border-white/10 rounded">
                    <img src="/pdf2.png" className="w-10 h-10 mr-2" />
                    <div>
                      <h4 className="">{file.name.slice(0, 29)}</h4>
                      <h5 className="text-sm">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </h5>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg mb-2">Upload Your Resume (PDF)</h3>
                  <h4 className="mb-1 text-gray-500 text-sm">
                    Drag & drop files here, or click to select files
                  </h4>
                  <h5 className="text-sm text-gray-500">
                    Supported file types: .pdf
                  </h5>
                </div>
              )}
            </div>
          </div>
          {fileError && (
            <p className="mt-2 text-red-400 text-sm flex items-center gap-1.5 animate-fade-in">
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
                />
              </svg>
              Please upload a resume PDF to continue.
            </p>
          )}
        </div>

        {/* Job role input */}
        <div className="w-full">
          <textarea
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setJobRole(e.target.value)
            }
            disabled={busy}
            className="w-full h-36 sm:h-40 md:h-54 bg-prd resize-none! p-4 overflow-hidden outline-none rounded-xl border border-white/10 focus:border-[#10B981]/60 smooth"
            placeholder="Enter job role (e.g. Data Analyst, Frontend Developer):"
          />
          <p
            className={`mt-2 text-xs flex items-center gap-1.5 ${
              (jobRole ?? "").trim() ? "text-[#10B981]" : "text-gray-500"
            }`}
          >
            {(jobRole ?? "").trim()
              ? "✓ Target role set — optimised specifically for this job."
              : "Optional — leave blank for a simple, general optimisation."}
          </p>
        </div>
      </div>

      {/* Template selector — hidden on mobile, shown on md+ */}
      <div className="flex flex-col lg:flex-row w-full space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="mt-5 bg-prd flex-1 rounded-xl p-3 border border-white/10 hidden md:block">
          <h4 className="mb-2">Select Template: </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((index) => {
              const available = index === 1; // only the first template is live
              return (
                <div
                  key={index}
                  className={`relative group rounded-lg overflow-hidden border border-white/10 aspect-[3/4] ${
                    busy ? "pointer-events-none opacity-60" : ""
                  } ${available ? "" : "cursor-not-allowed"}`}
                >
                  <img
                    src="/tmp1.jpg"
                    className={`h-full w-full object-cover transition-all duration-200 ${
                      available && selectedTemplate === index
                        ? "ring-2 ring-[#10B981]"
                        : ""
                    } ${available ? "" : "blur-[2px] opacity-70"}`}
                    alt={`Template ${index}`}
                  />
                  {available && selectedTemplate === index && (
                    <div className="absolute top-1.5 right-1.5 bg-[#10B981] rounded-full p-0.5">
                      <svg
                        className="w-4 h-4 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                  {available ? (
                    /* Hover actions */
                    <div
                      className={`absolute inset-0 bg-prd/70 backdrop-blur-[1px] flex items-center justify-center gap-2 transition-opacity duration-200 ${
                        busy ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedTemplate(index)}
                        className="bg-[#10B981] text-black text-xs font-semibold px-3 py-2 rounded-full hover:opacity-90 smooth active:scale-95"
                      >
                        Choose
                      </button>
                      <button
                        onClick={() => setViewTemplate(index)}
                        className="bg-white/90 text-black text-xs font-semibold px-3 py-2 rounded-full hover:bg-white smooth active:scale-95"
                      >
                        View
                      </button>
                    </div>
                  ) : (
                    /* Not available yet */
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="bg-black/50 backdrop-blur-sm border border-white/10 text-gray-200 text-[11px] font-medium px-3 py-1 rounded-full">
                        Coming soon
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Optimise button + supporting context */}
        <div className="mt-6 flex-1 flex flex-col items-center justify-center gap-3">
          <button
            onClick={handlePOST}
            disabled={busy}
            className="bg-white text-black w-full sm:w-auto justify-center px-8 sm:px-12 py-3.5 min-h-12 text-lg sm:text-xl font-semibold rounded-xl
              hover:cursor-pointer hover:opacity-90 smooth flex items-center gap-3
              disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {processing && (
              <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            )}
            {status === "success" ? "✓ Downloaded" : "OPTIMISE"}
          </button>

          <p className="text-gray-500 text-xs sm:text-sm flex items-center gap-1.5 text-center px-2">
            <SparkIcon />
            Your optimised PDF is generated in seconds & downloads automatically.
          </p>
        </div>
      </div>

      {/* Inline error banner */}
      {status === "error" && errorMsg && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 animate-fade-in w-full max-w-xl">
          <svg
            className="w-5 h-5 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
            />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Processing overlay */}
      {busy && statusInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-prd/70 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-prl border border-white/10 rounded-2xl shadow-2xl px-5 sm:px-10 py-8 sm:py-10 w-[22rem] sm:w-[26rem] max-w-[92vw] text-center animate-scale-in">
            {/* Close button - lets the user dismiss the completed box */}
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-txt hover:bg-white/10 smooth"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="relative w-20 h-20 mx-auto mb-6">
              {status === "success" ? (
                <>
                  {/* Completed: static full ring + gentle pulse + checkmark (no spin) */}
                  <div className="absolute inset-0 rounded-full border-2 border-[#10B981]" />
                  <div className="absolute inset-0 rounded-full bg-[#10B981]/20 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-9 h-9 text-[#10B981]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </>
              ) : (
                <>
                  {/* Processing: spinning ring + bobbing pebble */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#10B981] animate-spin" />
                  <PebbleIcon className="w-8 absolute inset-0 m-auto animate-floaty" />
                </>
              )}
            </div>

            {/* Optimisation-mode badge */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium mb-3 max-w-full ${
                mode === "full"
                  ? "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]"
                  : "border-white/10 bg-white/5 text-gray-400"
              }`}
            >
              <span>
                {mode === "full" ? "Full ATS optimisation" : "Simple optimisation"}
              </span>
              {mode === "full" && targetRole ? (
                <span className="max-w-[9rem] truncate text-gray-300">
                  · {targetRole}
                </span>
              ) : (
                <span className="text-gray-500">· no target role</span>
              )}
            </div>

            <h3 className="text-txt text-xl font-hero mb-2">
              {statusInfo.title}
            </h3>
            <p className="text-gray-400 text-sm mb-6">{statusSub}</p>

            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  status === "success"
                    ? "w-full bg-[#10B981]"
                    : status === "uploading"
                      ? "bg-[#10B981]"
                      : "w-1/2 bg-[#10B981] loading-sweep"
                }`}
                style={
                  status === "uploading"
                    ? { width: `${uploadProgress}%`, transition: "width 140ms ease-out" }
                    : undefined
                }
              />
            </div>

            {status === "uploading" && (
              <p className="text-gray-500 text-xs mt-3 font-medium text-[#10B981]">
                {uploadProgress}%
              </p>
            )}

            {status === "success" && countdown !== null && (
              <p className="text-gray-500 text-xs mt-5 tracking-wide">
                Closing in{" "}
                <span className="text-[#10B981]">…</span>
                <span className="text-[#10B981] font-semibold ml-0.5">
                  {countdown}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Template preview modal */}
      {viewTemplate !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-prd/85 backdrop-blur-md animate-fade-in p-3 sm:p-6"
          onClick={() => setViewTemplate(null)}
        >
          <div
            className="relative bg-prl border border-white/10 rounded-2xl shadow-2xl animate-scale-in w-full max-w-4xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <h3 className="text-txt font-hero text-base tracking-wide">
                  Template {viewTemplate}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 border border-white/10 rounded-full px-3 py-1">
                  Preview
                </span>
                <button
                  onClick={() => setViewTemplate(null)}
                  aria-label="Close preview"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-txt hover:bg-white/10 smooth"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image area */}
            <div className="px-6 py-6 bg-prd/40">
              <img
                src="/tmp1.jpg"
                alt={`Template ${viewTemplate}`}
                className="mx-auto w-auto h-auto max-h-[70vh] object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-5 py-3.5 border-t border-white/10 bg-prd/30">
              <span
                className={`text-[11px] font-medium rounded-full px-3 py-1 ${
                  viewTemplate === 1
                    ? "bg-[#10B981]/15 text-[#10B981]"
                    : "bg-white/5 text-gray-400"
                }`}
              >
                {viewTemplate === 1 ? "Available" : "Coming soon"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Abort confirmation toast */}
      {showAbortMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md animate-scale-in">
          <div className="flex items-start gap-3 bg-prl border border-white/10 rounded-xl px-5 py-4 shadow-2xl">
            <div className="w-8 h-8 shrink-0 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-txt text-sm font-medium">Process aborted</p>
              <p className="text-gray-400 text-xs mt-0.5">
                The optimisation was stopped — no file was downloaded. You can
                start again anytime.
              </p>
            </div>
            <button
              onClick={hideAbortToast}
              aria-label="Dismiss"
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-txt hover:bg-white/10 smooth"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pebble;
