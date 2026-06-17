// Document block-types schema — drives both the viewer and the editor.
// Designed to be schema-compatible with a future `documents/sections/blocks`
// backend layout. For now, the existing flat `videos.steps` table can be
// projected into this shape on the fly.

export type DocOutputType =
  | "sop"
  | "training"
  | "bug_report"
  | "changelog"
  | "audit"
  | "client_handover";

export interface DocumentMeta {
  id: string;
  title: string;
  summary: string;
  output_type: DocOutputType;
  status: "draft" | "published" | "processing" | "failed";
  created_at: string;
  updated_at: string;
  source_duration_seconds?: number;
  source_size_bytes?: number;
  tags?: string[];
  author?: string;
}

export type Block =
  | ParagraphBlock
  | StepBlock
  | CalloutBlock
  | CodeBlock
  | ImageBlock
  | DecisionBlock
  | ListBlock
  | TableBlock
  | LinkBlock;

interface BlockBase {
  id: string;
  order: number;
}

export interface ParagraphBlock extends BlockBase {
  type: "paragraph";
  text: string;
}

export interface StepBlock extends BlockBase {
  type: "step";
  number: number;
  title: string;
  detail?: string;
  timestamp_seconds?: number;
  image_url?: string;
}

export interface CalloutBlock extends BlockBase {
  type: "callout";
  kind: "note" | "tip" | "warning" | "danger";
  title?: string;
  text: string;
}

export interface CodeBlock extends BlockBase {
  type: "code";
  language?: string;
  code: string;
  caption?: string;
}

export interface ImageBlock extends BlockBase {
  type: "image";
  url: string;
  caption?: string;
  alt?: string;
  /** When Pass 2 emits an image referring to one of the source video frames. */
  frame_id?: string;
  /** When the image lives in Supabase Storage (uploaded via editor). */
  storage_key?: string;
}

export interface DecisionBlock extends BlockBase {
  type: "decision";
  question: string;
  branches: { label: string; outcome: string }[];
}

export interface ListBlock extends BlockBase {
  type: "list";
  ordered: boolean;
  items: string[];
  intro?: string;
}

export interface TableBlock extends BlockBase {
  type: "table";
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface LinkBlock extends BlockBase {
  type: "link";
  url: string;
  label: string;
  description?: string;
}

export interface Section {
  id: string;
  order: number;
  heading: string;
  intro?: string;
  blocks: Block[];
}

export interface Document extends DocumentMeta {
  sections: Section[];
}

/* ──────────────────────────────────────────────────────────────────
   Sample document — used by the viewer/editor preview screens
   while the backend pipeline is being upgraded to emit this schema.
   ────────────────────────────────────────────────────────────────── */
export const sampleDocument: Document = {
  id: "sample",
  title: "Onboarding a new client to the dispatch portal",
  summary:
    "How to invite a freight client, configure their account, and assign a dispatch contact. Targets ~5 min from start to first usable account.",
  output_type: "sop",
  status: "published",
  created_at: "2026-05-21T14:32:00Z",
  updated_at: "2026-05-26T09:11:00Z",
  source_duration_seconds: 184,
  source_size_bytes: 27_400_000,
  tags: ["client-onboarding", "dispatch", "v3"],
  author: "Jane Doe",
  sections: [
    {
      id: "s1",
      order: 1,
      heading: "Overview",
      intro:
        "This SOP walks you through adding a brand-new freight client end-to-end: account creation, contact assignment, and the first test booking.",
      blocks: [
        {
          id: "b1",
          order: 1,
          type: "paragraph",
          text: "Use this flow for any client you onboarded from the sales pipeline (status='qualified'). For trial clients, use the lighter 'Trial onboarding' SOP instead — that one skips the contract step.",
        },
        {
          id: "b2",
          order: 2,
          type: "list",
          ordered: false,
          intro: "You'll need:",
          items: [
            "Admin or Dispatch Manager role",
            "Client's legal name + EIN",
            "Primary contact name + email",
            "A signed MSA on file in Dropbox (link must be ready to paste)",
          ],
        },
      ],
    },
    {
      id: "s2",
      order: 2,
      heading: "Create the client account",
      blocks: [
        {
          id: "b3",
          order: 1,
          type: "step",
          number: 1,
          title: "Open Portal → Clients → Add Client",
          detail:
            "From any page, use the global ⌘+K palette and type 'add client' to jump straight there.",
          timestamp_seconds: 14,
        },
        {
          id: "b4",
          order: 2,
          type: "step",
          number: 2,
          title: "Fill in legal name and EIN",
          detail:
            "EIN must match the format XX-XXXXXXX. The portal will reject pasted spaces — type or paste cleanly.",
          timestamp_seconds: 37,
        },
        {
          id: "b5",
          order: 3,
          type: "callout",
          kind: "warning",
          title: "Don't skip the EIN",
          text: "If you leave EIN blank, the client can be created but will be flagged read-only by Finance the next morning. Better to delay than to ship it incomplete.",
        },
        {
          id: "b6",
          order: 4,
          type: "step",
          number: 3,
          title: "Paste the MSA Dropbox link into 'Contract URL'",
          detail:
            "Sharing permission must be 'Anyone with the link can view'. Anything stricter will fail the silent compliance check at midnight.",
          timestamp_seconds: 71,
        },
      ],
    },
    {
      id: "s3",
      order: 3,
      heading: "Assign dispatch contact",
      blocks: [
        {
          id: "b7",
          order: 1,
          type: "step",
          number: 4,
          title: "Open the new client's profile → 'Contacts' tab",
          timestamp_seconds: 92,
        },
        {
          id: "b8",
          order: 2,
          type: "decision",
          question: "Is the client US-domestic or cross-border?",
          branches: [
            {
              label: "Domestic only",
              outcome:
                "Assign the on-shift dispatcher from rotation (Dispatch → Rota → today's column).",
            },
            {
              label: "Cross-border (CA/MX)",
              outcome:
                "Assign Maria from the Borders desk — she owns all CBP and SAT clearance escalations.",
            },
          ],
        },
        {
          id: "b9",
          order: 3,
          type: "step",
          number: 5,
          title: "Set 'Send welcome email' to ON before saving",
          detail:
            "The welcome email contains their tracking-portal login link. Without it, they have no way in.",
          timestamp_seconds: 118,
        },
      ],
    },
    {
      id: "s4",
      order: 4,
      heading: "Verify with a test booking",
      blocks: [
        {
          id: "b10",
          order: 1,
          type: "paragraph",
          text: "Before declaring the client live, create one $0 test booking against their account and cancel it. This confirms the rate matrix loaded correctly.",
        },
        {
          id: "b11",
          order: 2,
          type: "callout",
          kind: "tip",
          title: "Use the dummy lane",
          text: "Lane 'TEST-DALLAS-DALLAS' is wired so it never reaches a driver. Safe to use without alarming anyone.",
        },
        {
          id: "b12",
          order: 3,
          type: "code",
          language: "bash",
          caption: "Quick-create a test booking from the CLI (Dispatch Tools repo)",
          code: "dispatch test-booking --client=<client-id> --lane=TEST-DALLAS-DALLAS --amount=0",
        },
      ],
    },
  ],
};
