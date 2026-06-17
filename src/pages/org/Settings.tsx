import { useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Pill from "../../components/ui/Pill";
import { useOrg } from "../../contexts/OrgContext";

type SectionId = "general" | "branding" | "billing" | "integrations" | "danger";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding" },
  { id: "billing", label: "Plan & billing" },
  { id: "integrations", label: "Integrations" },
  { id: "danger", label: "Danger zone" },
];

const Settings = () => {
  const { activeOrg } = useOrg();
  const [section, setSection] = useState<SectionId>("general");

  return (
    <MainLayout breadcrumbs={[{ label: activeOrg?.name ?? "Workspace" }, { label: "Settings" }]}>
      <div className="px-6 py-6 max-w-[1100px]">
        <div className="mb-5">
          <h1 className="text-[20px] font-semibold tracking-tight text-white">Settings</h1>
          <p className="text-[12px] text-t4 mt-0.5">
            Organization-level configuration. Changes affect everyone in {activeOrg?.name ?? "this workspace"}.
          </p>
        </div>

        <div className="flex gap-6">
          <aside className="w-[160px] flex-shrink-0">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={[
                  "block w-full text-left px-2.5 py-1.5 rounded-sm text-[12px] mb-0.5 transition",
                  section === s.id
                    ? "bg-s2 text-white font-medium"
                    : "text-t4 hover:bg-s1 hover:text-t2",
                ].join(" ")}
              >
                {s.label}
              </button>
            ))}
          </aside>

          <main className="flex-1 max-w-[560px] flex flex-col gap-4">
            {section === "general" && (
              <div className="bg-s1 border border-l1 rounded-md p-5 flex flex-col gap-4">
                <Input
                  label="Organization name"
                  value={activeOrg?.name ?? ""}
                  readOnly
                  hint="Visible to all members and on exported documents."
                />
                <Input
                  label="Slug"
                  value={activeOrg?.slug ?? ""}
                  readOnly
                  hint="Used for share links. Cannot be changed yet."
                />
                <div className="flex justify-end pt-2 border-t border-l1">
                  <Button variant="ghost" disabled>
                    Save changes
                  </Button>
                </div>
              </div>
            )}

            {section === "branding" && (
              <div className="bg-s1 border border-l1 rounded-md p-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-t5 mb-3">
                  Branding
                </div>
                <p className="text-[12px] text-t4 leading-relaxed mb-4">
                  Upload a logo and pick a primary colour. Used on exported PDFs, share links, and the customer-facing viewer.
                </p>
                <div className="text-[12px] text-t5">
                  Coming in the next release.
                </div>
              </div>
            )}

            {section === "billing" && (
              <div className="bg-s1 border border-l1 rounded-md p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[13px] font-medium text-t1">Free plan</div>
                    <div className="text-[12px] text-t5 mt-0.5">
                      {activeOrg?.max_seats ?? 0} seats · 5 documents/month
                    </div>
                  </div>
                  <Pill variant="ok">Active</Pill>
                </div>
                <div className="pt-3 border-t border-l1">
                  <Button variant="primary" disabled>
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            )}

            {section === "integrations" && (
              <div className="bg-s1 border border-l1 rounded-md p-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-t5 mb-3">
                  Integrations
                </div>
                {[
                  { name: "Notion", desc: "Push generated docs into a Notion database." },
                  { name: "Confluence", desc: "Sync as Confluence pages with the team." },
                  { name: "Slack", desc: "Get notified when a document is ready." },
                  { name: "n8n / Make.com", desc: "Programmatic uploads via API token." },
                ].map((it) => (
                  <div
                    key={it.name}
                    className="flex items-center justify-between py-3 border-b border-l1 last:border-0"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-t2">{it.name}</div>
                      <div className="text-[11px] text-t5 mt-0.5">{it.desc}</div>
                    </div>
                    <Button variant="ghost" size="sm" disabled>
                      Coming soon
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {section === "danger" && (
              <div className="bg-s1 border border-err-line rounded-md p-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-err-fg mb-2">
                  Danger zone
                </div>
                <p className="text-[12px] text-t4 leading-relaxed mb-4">
                  Deleting your organization will remove all documents, members, and invitations. This action cannot be undone.
                </p>
                <Button variant="danger" disabled>
                  Delete organization
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
