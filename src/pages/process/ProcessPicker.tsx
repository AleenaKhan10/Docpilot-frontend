import { Link } from "react-router-dom";
import { FileVideo, Github, Zap } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import Pill from "../../components/ui/Pill";
import { useOrg } from "../../contexts/OrgContext";

const ProcessPicker = () => {
  const { activeOrg } = useOrg();

  const canManageSources =
    activeOrg?.role === "owner" || activeOrg?.role === "admin";

  return (
    <MainLayout
      breadcrumbs={[{ label: activeOrg?.name ?? "Workspace" }, { label: "Generate" }]}
    >
      <div className="px-6 py-6 max-w-[1100px] mx-auto">
        <div className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent mb-3">
            New document · Step 1 of 2
          </div>
          <h1 className="font-serif font-normal text-[42px] tracking-tight text-t1 leading-[1.02] mb-3 max-w-[18ch]">
            Start a new document
          </h1>
          <p className="font-serif italic text-[17px] text-t3 leading-relaxed max-w-[46ch]">
            Pick a source. Docpilot pulls the content and generates a structured document
            you can edit and share.
          </p>
        </div>

        <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-t5 mb-2.5">
          Choose a source
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Video */}
          <Link
            to="/process/video"
            className="bg-s1 border border-l1 rounded-md p-5 flex flex-col gap-3 transition h-full hover:border-l3 hover:bg-s2 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-s2 border border-l2 rounded-md flex items-center justify-center">
                <FileVideo size={18} className="text-t2" />
              </div>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-t1 mb-1">
                From a screen recording
              </div>
              <div className="text-[11px] text-t4 leading-[1.55]">
                Upload a Loom, GDrive, or MP4 recording. Docpilot turns it into a structured, editable document.
              </div>
            </div>
            <div className="mt-auto pt-3 border-t border-l1 font-mono text-[10px] text-t5">
              Loom · GDrive · MP4 · Available now
            </div>
          </Link>

          {/* GitHub — active */}
          {canManageSources ? (
            <Link
              to="/process/repo"
              className="bg-s1 border border-l1 rounded-md p-5 flex flex-col gap-3 transition h-full hover:border-l3 hover:bg-s2 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-s2 border border-l2 rounded-md flex items-center justify-center">
                  <Github size={18} className="text-t2" />
                </div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-t1 mb-1">
                  From a GitHub repository
                </div>
                <div className="text-[11px] text-t4 leading-[1.55]">
                  Install the Docpilot GitHub App, pick repos, and generate a product overview or developer reference grounded in the actual code.
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-l1 font-mono text-[10px] text-t5">
                Owner / admin only
              </div>
            </Link>
          ) : (
            <div
              className="bg-s1 border border-l1 rounded-md p-5 flex flex-col gap-3 transition h-full opacity-50 cursor-not-allowed"
              aria-disabled="true"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-s2 border border-l2 rounded-md flex items-center justify-center">
                  <Github size={18} className="text-t2" />
                </div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-t1 mb-1">
                  From a GitHub repository
                </div>
                <div className="text-[11px] text-t4 leading-[1.55]">
                  Install the Docpilot GitHub App, pick repos, and generate a product overview or developer reference grounded in the actual code.
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-l1 font-mono text-[10px] text-t5">
                Ask an owner or admin to connect
              </div>
            </div>
          )}

          {/* Workflow — placeholder */}
          <div
            className="bg-s1 border border-l1 rounded-md p-5 flex flex-col gap-3 transition h-full opacity-50 cursor-not-allowed"
            aria-disabled="true"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-s2 border border-l2 rounded-md flex items-center justify-center">
                <Zap size={18} className="text-t2" />
              </div>
              <Pill variant="neutral">Coming soon</Pill>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-t1 mb-1">
                From a workflow tool
              </div>
              <div className="text-[11px] text-t4 leading-[1.55]">
                Connect Zapier, Make, or n8n and turn each workflow into a step-by-step operational doc.
              </div>
            </div>
            <div className="mt-auto pt-3 border-t border-l1 font-mono text-[10px] text-t5">
              Not available yet
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default ProcessPicker;
