import { useRef } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import BlockToolbar, { type AddBlockType } from "./BlockToolbar";
import type { Block, CalloutBlock } from "../../lib/doc-types";
import { uploadFile } from "../../lib/api";

interface EditableBlockProps {
  block: Block;
  videoId: number | undefined;
  onChange: (next: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddBelow: (type: AddBlockType) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const CALLOUT_KINDS: CalloutBlock["kind"][] = ["tip", "note", "warning", "danger"];

const EditableBlock = ({
  block,
  videoId,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddBelow,
  canMoveUp,
  canMoveDown,
}: EditableBlockProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const updateField = (patch: Record<string, unknown>) => {
    onChange({ ...block, ...patch } as Block);
  };

  const handleImageUpload = async (file: File) => {
    if (!videoId) {
      alert("Save the document once before uploading new images.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await uploadFile<{ storage_key: string; url: string }>(
        `/api/v1/videos/${videoId}/images`,
        fd
      );
      updateField({ url: res.url, storage_key: res.storage_key, frame_id: undefined });
    } catch (e) {
      alert(`Upload failed: ${e instanceof Error ? e.message : e}`);
    }
  };

  return (
    <div
      className="group relative -mx-3 px-3 py-2 rounded-md hover:bg-s2/40 transition"
      tabIndex={-1}
    >
      <BlockToolbar
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDelete={onDelete}
        onAddBelow={onAddBelow}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      />

      {block.type === "paragraph" && (
        <RichTextEditor
          html={block.text || ""}
          onChange={(html) => updateField({ text: html })}
          placeholder="Write a paragraph…"
        />
      )}

      {block.type === "step" && (
        <div className="flex gap-4">
          <div className="font-mono text-[11px] text-t5 w-7 flex-shrink-0 pt-2 text-right">
            {String(block.number).padStart(2, "0")}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <input
              value={block.title || ""}
              onChange={(e) => updateField({ title: e.target.value })}
              placeholder="Step title"
              className="bg-transparent border-b border-l1 focus:border-l3 outline-none text-[13px] font-medium text-t1 pb-1"
            />
            <RichTextEditor
              html={block.detail || ""}
              onChange={(html) => updateField({ detail: html })}
              placeholder="Detail (optional)…"
              compact
            />
          </div>
        </div>
      )}

      {block.type === "callout" && (
        <div className="border border-l2 rounded-md p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <select
              value={block.kind}
              onChange={(e) =>
                updateField({ kind: e.target.value as CalloutBlock["kind"] })
              }
              className="bg-s2 border border-l1 rounded-sm px-2 py-1 text-[11px] text-t1 outline-none focus:border-l3"
            >
              {CALLOUT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <input
              value={block.title || ""}
              onChange={(e) => updateField({ title: e.target.value })}
              placeholder="Optional title"
              className="flex-1 bg-transparent border-b border-l1 focus:border-l3 outline-none text-[12px] text-t1 pb-1"
            />
          </div>
          <RichTextEditor
            html={block.text || ""}
            onChange={(html) => updateField({ text: html })}
            placeholder="Callout text…"
            compact
          />
        </div>
      )}

      {block.type === "image" && (
        <div className="border border-l1 rounded-md overflow-hidden bg-s1">
          {block.url ? (
            <img src={block.url} alt={block.alt ?? ""} className="block w-full" />
          ) : block.frame_id ? (
            <div className="px-4 py-3 text-[11px] font-mono text-t5">
              Referenced: {block.frame_id} (will resolve when saved)
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <ImageIcon size={20} className="mx-auto text-t5 mb-2" />
              <div className="text-[12px] text-t5">No image yet</div>
            </div>
          )}
          <div className="p-3 flex flex-col gap-2 border-t border-l1">
            <input
              value={block.caption ?? ""}
              onChange={(e) => updateField({ caption: e.target.value })}
              placeholder="Caption…"
              className="bg-s2 border border-l1 rounded-sm px-2.5 py-1.5 text-[12px] text-t1 outline-none focus:border-l3"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 text-[11px] text-t3 hover:text-t1 border border-l2 rounded-sm px-2.5 py-1.5 hover:bg-s2 self-start"
            >
              <Upload size={12} /> Replace image
            </button>
          </div>
        </div>
      )}

      {block.type === "link" && (
        <div className="border border-l1 rounded-md bg-s1 p-3 flex flex-col gap-2">
          <input
            value={block.label || ""}
            onChange={(e) => updateField({ label: e.target.value })}
            placeholder="Label"
            className="bg-s2 border border-l1 rounded-sm px-2.5 py-1.5 text-[12px] text-t1 outline-none focus:border-l3"
          />
          <input
            value={block.url || ""}
            onChange={(e) => updateField({ url: e.target.value })}
            placeholder="https://…"
            className="bg-s2 border border-l1 rounded-sm px-2.5 py-1.5 text-[12px] text-t1 outline-none focus:border-l3"
          />
          <input
            value={block.description ?? ""}
            onChange={(e) => updateField({ description: e.target.value })}
            placeholder="Description (optional)"
            className="bg-s2 border border-l1 rounded-sm px-2.5 py-1.5 text-[12px] text-t4 outline-none focus:border-l3"
          />
        </div>
      )}

      {block.type === "list" && (
        <div className="flex flex-col gap-1.5">
          <input
            value={block.intro ?? ""}
            onChange={(e) => updateField({ intro: e.target.value })}
            placeholder="List intro (optional)"
            className="bg-transparent text-[12px] text-t3 border-b border-l1 focus:border-l3 outline-none pb-1"
          />
          {block.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-t5 flex-shrink-0" />
              <input
                value={item}
                onChange={(e) => {
                  const next = [...block.items];
                  next[i] = e.target.value;
                  updateField({ items: next });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && i === block.items.length - 1) {
                    updateField({ items: [...block.items, ""] });
                  } else if (
                    e.key === "Backspace" &&
                    !item &&
                    block.items.length > 1
                  ) {
                    e.preventDefault();
                    updateField({
                      items: block.items.filter((_, j) => j !== i),
                    });
                  }
                }}
                placeholder="List item"
                className="flex-1 bg-transparent text-[13px] text-t2 outline-none border-b border-transparent focus:border-l1 pb-1"
              />
            </div>
          ))}
          {block.items.length === 0 && (
            <button
              onClick={() => updateField({ items: [""] })}
              className="text-[11px] text-t5 hover:text-t3 self-start"
            >
              + Add item
            </button>
          )}
        </div>
      )}

      {/* Fallback for other block types not yet supported in the editor */}
      {!["paragraph", "step", "callout", "image", "link", "list"].includes(
        block.type
      ) && (
        <div className="bg-s2 border border-l2 rounded-md px-3 py-2 text-[11px] text-t5 font-mono">
          {block.type} block (read-only in this pass)
        </div>
      )}
    </div>
  );
};

export default EditableBlock;
