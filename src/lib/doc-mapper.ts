// Projects the backend's flat-step video response into the rich
// Section/Block document shape the new viewer expects.
//
// Rules:
// • Consecutive steps sharing the same `title` are merged into one Section.
// • Each step becomes a `step` block.
// • If the step has a `tip` or `note`, an extra Callout block is emitted
//   *after* the step (so it reads as supporting context).
// • If the step has an `url`, a Link block is emitted after the step.
// • The first non-null `section_summary` in a group becomes the Section intro.
//
// This is a transitional mapping. The next backend pass will emit
// sections/blocks natively, at which point this can be deleted.

import type { Block, Document, Section, StepBlock, CalloutBlock, LinkBlock } from "./doc-types";
import type { BackendStep, BackendVideoDetail, VideoStatus } from "./video-types";

const DEFAULT_SECTION_HEADING = "Steps";

const stepBlockOf = (step: BackendStep, order: number): StepBlock => ({
  id: `step-${step.step_number}`,
  order,
  type: "step",
  number: step.step_number,
  title: step.title?.trim() || step.description.split(".")[0].slice(0, 80),
  detail:
    // If we used the title for the headline, push the description into detail.
    step.title?.trim()
      ? step.description
      : step.description.length > 80
      ? step.description.slice(step.description.split(".")[0].length).trim() || undefined
      : undefined,
  timestamp_seconds: step.timestamp ?? undefined,
  image_url: step.image_url ?? undefined,
});

const tipCalloutOf = (step: BackendStep, order: number): CalloutBlock => ({
  id: `tip-${step.step_number}`,
  order,
  type: "callout",
  kind: "tip",
  text: step.tip!,
});

const noteCalloutOf = (step: BackendStep, order: number): CalloutBlock => ({
  id: `note-${step.step_number}`,
  order,
  type: "callout",
  kind: "note",
  text: step.note!,
});

const linkBlockOf = (step: BackendStep, order: number): LinkBlock => ({
  id: `link-${step.step_number}`,
  order,
  type: "link",
  url: step.url!,
  label: step.url!,
});

const explanationParagraph = (step: BackendStep, order: number): Block => ({
  id: `expl-${step.step_number}`,
  order,
  type: "paragraph",
  text: step.explanation!,
});

export function videoToDocument(video: BackendVideoDetail): Document {
  const sections: Section[] = [];
  let currentSectionTitle: string | null | undefined = undefined;
  let currentSection: Section | null = null;
  let blockOrder = 1;

  const ensureSection = (heading: string, intro?: string) => {
    currentSection = {
      id: `s-${sections.length + 1}`,
      order: sections.length + 1,
      heading,
      intro,
      blocks: [],
    };
    sections.push(currentSection);
    blockOrder = 1;
  };

  for (const step of video.steps) {
    const stepTitle = step.title?.trim() || "";
    if (stepTitle !== currentSectionTitle) {
      currentSectionTitle = stepTitle;
      ensureSection(stepTitle || DEFAULT_SECTION_HEADING, step.section_summary ?? undefined);
    }
    if (!currentSection) ensureSection(DEFAULT_SECTION_HEADING);

    currentSection!.blocks.push(stepBlockOf(step, blockOrder++));

    if (step.explanation?.trim())
      currentSection!.blocks.push(explanationParagraph(step, blockOrder++));

    if (step.tip?.trim())
      currentSection!.blocks.push(tipCalloutOf(step, blockOrder++));

    if (step.note?.trim())
      currentSection!.blocks.push(noteCalloutOf(step, blockOrder++));

    if (step.url?.trim())
      currentSection!.blocks.push(linkBlockOf(step, blockOrder++));
  }

  return {
    id: String(video.id),
    title: video.title || "Untitled document",
    summary:
      sections.length > 0 && sections[0].intro
        ? sections[0].intro
        : "Generated from a screen recording. Review and edit any section that needs more context.",
    output_type: "sop",
    status: backendToDocStatus(video.status),
    created_at: video.created_at,
    updated_at: video.updated_at ?? video.created_at,
    sections,
  };
}

const backendToDocStatus = (
  s: VideoStatus
): "draft" | "published" | "processing" | "failed" => {
  switch (s) {
    case "completed":
      return "published";
    case "processing":
    case "pending":
      return "processing";
    case "failed":
      return "failed";
  }
};
