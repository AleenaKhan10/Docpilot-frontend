import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import Button from "../ui/Button";
import EditableBlock from "./EditableBlock";
import type { AddBlockType } from "./BlockToolbar";
import type {
  Block,
  CalloutBlock,
  Document,
  ImageBlock,
  LinkBlock,
  ListBlock,
  ParagraphBlock,
  Section,
  StepBlock,
} from "../../lib/doc-types";

interface DocumentEditorProps {
  document: Document;
  videoId: number | undefined;
  saving: boolean;
  error: string | null;
  onSave: (doc: Document) => Promise<void>;
  onCancel: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const makeBlock = (type: AddBlockType, nextStepNumber: number): Block => {
  switch (type) {
    case "paragraph":
      return { id: uid(), order: 0, type: "paragraph", text: "" } as ParagraphBlock;
    case "step":
      return {
        id: uid(),
        order: 0,
        type: "step",
        number: nextStepNumber,
        title: "",
      } as StepBlock;
    case "callout":
      return {
        id: uid(),
        order: 0,
        type: "callout",
        kind: "tip",
        text: "",
      } as CalloutBlock;
    case "image":
      return {
        id: uid(),
        order: 0,
        type: "image",
        url: "",
        caption: "",
      } as ImageBlock;
    case "link":
      return {
        id: uid(),
        order: 0,
        type: "link",
        url: "",
        label: "",
      } as LinkBlock;
    case "list":
      return {
        id: uid(),
        order: 0,
        type: "list",
        ordered: false,
        items: [""],
      } as ListBlock;
  }
};

const DocumentEditor = ({
  document,
  videoId,
  saving,
  error,
  onSave,
  onCancel,
}: DocumentEditorProps) => {
  const [doc, setDoc] = useState<Document>(document);

  const updateDoc = (patch: Partial<Document>) => setDoc({ ...doc, ...patch });

  const updateSection = (sIdx: number, patch: Partial<Section>) => {
    const sections = [...doc.sections];
    sections[sIdx] = { ...sections[sIdx], ...patch };
    setDoc({ ...doc, sections });
  };

  const updateBlock = (sIdx: number, bIdx: number, next: Block) => {
    const sections = [...doc.sections];
    const blocks = [...sections[sIdx].blocks];
    blocks[bIdx] = next;
    sections[sIdx] = { ...sections[sIdx], blocks };
    setDoc({ ...doc, sections });
  };

  const deleteBlock = (sIdx: number, bIdx: number) => {
    const sections = [...doc.sections];
    sections[sIdx] = {
      ...sections[sIdx],
      blocks: sections[sIdx].blocks.filter((_, i) => i !== bIdx),
    };
    setDoc({ ...doc, sections });
  };

  const moveBlock = (sIdx: number, from: number, to: number) => {
    const sections = [...doc.sections];
    const blocks = [...sections[sIdx].blocks];
    if (to < 0 || to >= blocks.length) return;
    const [m] = blocks.splice(from, 1);
    blocks.splice(to, 0, m);
    sections[sIdx] = { ...sections[sIdx], blocks };
    setDoc({ ...doc, sections });
  };

  const addBlockBelow = (sIdx: number, afterIdx: number, type: AddBlockType) => {
    const sections = [...doc.sections];
    const blocks = [...sections[sIdx].blocks];
    const nextStepN =
      blocks.filter((b) => b.type === "step").length + 1;
    const newBlock = makeBlock(type, nextStepN);
    blocks.splice(afterIdx + 1, 0, newBlock);
    sections[sIdx] = { ...sections[sIdx], blocks };
    setDoc({ ...doc, sections });
  };

  const addSection = () => {
    const sections = [
      ...doc.sections,
      {
        id: uid(),
        order: doc.sections.length + 1,
        heading: "New section",
        blocks: [],
      } as Section,
    ];
    setDoc({ ...doc, sections });
  };

  const deleteSection = (sIdx: number) => {
    setDoc({ ...doc, sections: doc.sections.filter((_, i) => i !== sIdx) });
  };

  return (
    <>
      {/* Sticky save bar */}
      <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-l1 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-warn-fg">
            Editing
          </span>
          <span className="text-[11px] text-t4">Changes save when you hit Save.</span>
        </div>
        <div className="flex items-center gap-1.5">
          {error && (
            <span className="font-mono text-[10px] text-err-fg mr-2">{error}</span>
          )}
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            <X size={12} /> Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSave(doc)}
            disabled={saving}
          >
            <Save size={12} /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex gap-6 px-6 py-6 max-w-[1400px] mx-auto">
        <div className="flex-1 min-w-0 max-w-[760px]">
          {/* Doc header */}
          <div className="bg-s1 border border-l1 rounded-md px-6 py-5 mb-3">
            <input
              value={doc.title}
              onChange={(e) => updateDoc({ title: e.target.value })}
              placeholder="Document title"
              className="w-full bg-transparent text-[22px] font-semibold tracking-tight text-white leading-tight outline-none border-b border-l1 focus:border-l3 pb-1 mb-3"
            />
            <textarea
              value={doc.summary}
              onChange={(e) => updateDoc({ summary: e.target.value })}
              placeholder="Short summary…"
              rows={2}
              className="w-full bg-transparent text-[13px] text-t3 leading-relaxed outline-none resize-y border-b border-l1 focus:border-l3 pb-1"
            />
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-3">
            {doc.sections.map((section, sIdx) => (
              <section
                key={section.id}
                className="bg-s1 border border-l1 rounded-md px-6 py-6 group/section relative"
              >
                <button
                  onClick={() => deleteSection(sIdx)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-xs text-t5 hover:bg-err-bg hover:text-err-fg opacity-0 group-hover/section:opacity-100 transition flex items-center justify-center"
                  title="Delete section"
                >
                  <X size={12} />
                </button>

                <input
                  value={section.heading}
                  onChange={(e) =>
                    updateSection(sIdx, { heading: e.target.value })
                  }
                  placeholder="Section heading"
                  className="w-full bg-transparent text-[16px] font-semibold tracking-tight text-white outline-none border-b border-l1 focus:border-l3 pb-1 mb-3"
                />
                <input
                  value={section.intro ?? ""}
                  onChange={(e) =>
                    updateSection(sIdx, { intro: e.target.value })
                  }
                  placeholder="Section intro (optional)"
                  className="w-full bg-transparent text-[12px] text-t4 outline-none border-b border-l1 focus:border-l3 pb-1 mb-5"
                />

                <div className="flex flex-col gap-3">
                  {section.blocks.map((block, bIdx) => (
                    <EditableBlock
                      key={block.id}
                      block={block}
                      videoId={videoId}
                      onChange={(next) => updateBlock(sIdx, bIdx, next)}
                      onDelete={() => deleteBlock(sIdx, bIdx)}
                      onMoveUp={() => moveBlock(sIdx, bIdx, bIdx - 1)}
                      onMoveDown={() => moveBlock(sIdx, bIdx, bIdx + 1)}
                      onAddBelow={(type) => addBlockBelow(sIdx, bIdx, type)}
                      canMoveUp={bIdx > 0}
                      canMoveDown={bIdx < section.blocks.length - 1}
                    />
                  ))}
                </div>

                {section.blocks.length === 0 && (
                  <div className="flex justify-center gap-1.5 flex-wrap mt-3">
                    {(["paragraph", "step", "image", "callout"] as AddBlockType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => addBlockBelow(sIdx, -1, t)}
                        className="text-[11px] text-t5 hover:text-t2 border border-l2 hover:border-l3 rounded-sm px-2.5 py-1"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            ))}
            <button
              onClick={addSection}
              className="bg-s1 border border-dashed border-l2 rounded-md px-6 py-4 flex items-center justify-center gap-2 text-[12px] text-t4 hover:bg-s2 hover:border-l3 hover:text-t2 transition"
            >
              <Plus size={13} /> Add section
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentEditor;
