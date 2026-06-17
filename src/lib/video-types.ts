// Shape of the backend video + step responses (post-widening).

export type VideoStatus = "pending" | "processing" | "completed" | "failed";

export interface BackendStep {
  step_number: number;
  timestamp?: number | null;
  title?: string | null;
  description: string;
  section_summary?: string | null;
  tip?: string | null;
  note?: string | null;
  explanation?: string | null;
  url?: string | null;
  image_url?: string | null;
}

export type VideoAccessLevel = "owner" | "edit" | "view";

export interface BackendVideoSummary {
  id: number;
  title: string;
  status: VideoStatus;
  output_type?: string | null;
  user_context?: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at?: string | null;
  /** The viewer's effective access on this doc, populated by the API. */
  your_access?: VideoAccessLevel | null;
  // steps may or may not be included on the list endpoint; assume empty if missing
  steps?: BackendStep[];
}

export interface BackendVideoDetail extends BackendVideoSummary {
  // Rich editorial document from the two-pass synthesis (Pass 2 output,
  // with image-block frame_ids translated to signed URLs server-side).
  // When present, the frontend should render this directly via DocumentView.
  // When null, fall back to videoToDocument(flat steps).
  document_json: unknown | null;
  steps: BackendStep[];
}
