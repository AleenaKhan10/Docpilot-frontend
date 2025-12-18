import { Upload, Search, Eye, Download, Share } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import MainLayout from "../../components/layout/MainLayout";
import Badge from "../../components/ui/Badge";

type DocStatus = "Pending" | "Completed" | "Processing";

const Dashbaord = () => {
  const recentDocuments: { name: string; date: string; status: DocStatus }[] = [
    {
      name: "Onboarding Flow Walkthrough",
      date: "2025-12-09",
      status: "Completed",
    },
    {
      name: "Bug Reproduction Steps",
      date: "2025-12-09",
      status: "Processing",
    },
    { name: "Release Notes v2.1", date: "2025-12-08", status: "Pending" },
  ];

  const processingItems: { name: string; progress: number }[] = [
    { name: "API Integration Demo", progress: 35 },
    { name: "QA Regression Suite", progress: 70 },
  ];

  const documents: { name: string; date: string; status: DocStatus }[] = [
    { name: "Support Training Video", date: "2025-12-07", status: "Completed" },
    { name: "Payments Setup Guide", date: "2025-12-06", status: "Pending" },
    { name: "Mobile App Walkthrough", date: "2025-12-05", status: "Completed" },
    { name: "Admin Portal Tutorial", date: "2025-12-04", status: "Processing" },
  ];

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-md shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-900">Upload Video</div>
              <Upload className="text-blue-700" size={18} />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Quickly upload a screen recording to generate documentation.
            </p>
            <Button variant="fill" className="w-[200px]" btnText="Upload">
              <Upload size={18} />
            </Button>
          </div>

          <div className="bg-white rounded-md shadow-md p-4">
            <div className="font-semibold text-gray-900 mb-3">
              Recent Documents
            </div>
            <div className="space-y-2">
              {recentDocuments.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="text-sm text-gray-800">{d.name}</div>
                  <Badge label={d.status} variant={d.status} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* <div className="bg-white rounded-md shadow-md p-4">
            <div className="font-semibold text-gray-900 mb-3">
              Processing Status
            </div>
            <div className="space-y-3">
              {processingItems.map((p) => (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-gray-800">
                    <span>{p.name}</span>
                    <span>{p.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </div>

        <div className="bg-white rounded-md shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-gray-900">All Documents</div>
            <div className="w-64 hidden md:block">
              <Input
                placeholder="Filter by name"
                variant="filled"
                inputSize="md"
                leftIcon={<Search size={18} />}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">Document Name</th>
                  <th className="p-2">Created Date</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {documents.map((doc) => (
                  <tr key={doc.name} className="border-t border-gray-100">
                    <td className="p-2">{doc.name}</td>
                    <td className="p-2">{doc.date}</td>
                    <td className="p-2">
                      <Badge
                        label={doc.status}
                        variant={doc.status}
                        size="sm"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye size={16} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashbaord;
