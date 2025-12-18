import React, { useState, useRef } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { Upload, FileVideo, X, CheckCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import clsx from "clsx";

const UploadVideo = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (uploadedFile: File) => {
    // Basic validation for video types
    if (uploadedFile.type.startsWith("video/")) {
      setFile(uploadedFile);
      // Auto-fill title with filename if empty
      if (!title) {
        setTitle(uploadedFile.name.replace(/\.[^/.]+$/, ""));
      }
    } else {
      alert("Please upload a valid video file.");
    }
  };

  const removeFile = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUpload = () => {
    if (!file) return;
    // Simulate upload logic here
    console.log("Uploading:", { file, title, description });
    alert("Upload functionality would be implemented here.");
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Upload Video</h1>
          <p className="text-sm text-gray-600 mt-1">
            Upload your screen recording to generate documentation
            automatically.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          {/* Drag and Drop Zone */}
          <div
            className={clsx(
              "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 flex flex-col items-center justify-center text-center",
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
              file ? "bg-blue-50/50 border-blue-200" : ""
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="video/*"
              onChange={handleChange}
            />

            {!file ? (
              <>
                <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Drag and drop video file
                </h3>
                <p className="text-sm text-gray-500 mt-2 mb-4">
                  or click to browse your files
                </p>
                <p className="text-xs text-gray-400">
                  Supported formats: MP4, MOV, WebM (Max 500MB)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={onButtonClick}
                  btnText="Select File"
                />
              </>
            ) : (
              <div className="w-full flex items-center justify-between p-4 bg-white rounded-md border border-blue-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <FileVideo size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 truncate max-w-[200px] md:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="mt-8 space-y-6">
            <Input
              label="Video Title"
              placeholder="e.g. User Onboarding Flow"
              variant="default"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="flex flex-col gap-1 w-full">
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-gray-300 bg-white p-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 resize-y"
                placeholder="Add a brief description about this video..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button variant="ghost" btnText="Cancel" onClick={removeFile} />
            <Button
              variant="fill"
              btnText="Upload & Process"
              disabled={!file}
              onClick={handleUpload}
              className={clsx(!file && "opacity-50 cursor-not-allowed")}
            >
              <CheckCircle size={18} />
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UploadVideo;
