type SummaryType = "success" | "error" | "info";

interface CallbackSummary {
  type: SummaryType;
  title: string;
  message: string;
}

export interface CallbackRecord {
  receivedAt: string;
  body: any;
  summary: CallbackSummary;
}

const globalStore = globalThis as typeof globalThis & {
  __latestN8nCallback?: CallbackRecord | null;
};

function toPlainString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function deriveSummary(body: any): CallbackSummary {
  // Check for UploadStatus first - if it's "uploaded", show success
  if (body?.UploadStatus === "uploaded") {
    return {
      type: "success",
      title: "Upload Complete",
      message: "Hey, check out the YouTube automation done successfully!",
    };
  }

  if (body?.llmerror ?? body?.llmError) {
    return {
      type: "error",
      title: "LLM Error",
      message: toPlainString(body.llmerror ?? body.llmError),
    };
  }

  if (body?.youtubeerror ?? body?.youtubeError ?? body?.youtube_error) {
    return {
      type: "error",
      title: "YouTube Error",
      message: toPlainString(body.youtubeerror ?? body.youtubeError ?? body.youtube_error),
    };
  }

  if (body?.error) {
    return {
      type: "error",
      title: "Automation Error",
      message: toPlainString(body.error),
    };
  }

  if (body?.youtubeUrl) {
    return {
      type: "success",
      title: "Upload Complete",
      message: `Video uploaded to YouTube: ${toPlainString(body.youtubeUrl)}`,
    };
  }

  if (body?.message) {
    return {
      type: "info",
      title: "Automation Message",
      message: toPlainString(body.message),
    };
  }

  return {
    type: "success",
    title: "Automation Complete",
    message: "Hey, check out the YouTube automation done successfully!",
  };
}

export function setLatestCallback(body: any): CallbackRecord {
  const record: CallbackRecord = {
    receivedAt: new Date().toISOString(),
    body,
    summary: deriveSummary(body),
  };
  globalStore.__latestN8nCallback = record;
  return record;
}

export function getLatestCallback(): CallbackRecord | null {
  return globalStore.__latestN8nCallback ?? null;
}

