import { useState, useEffect } from "react";
import api from "../../api/axios";
import { UploadCloud, Loader2, X } from "lucide-react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  existingData?: any;
  tenantSlug: string;
}

export default function AdminUpload({
  onClose,
  onSuccess,
  existingData,
  tenantSlug,
}: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ✅ REMOVE EXISTING FILES (IDs)
  const [removeFileIds, setRemoveFileIds] = useState<number[]>([]);
const [existingFiles, setExistingFiles] = useState<any[]>([]);
  // ============================
  // 📤 SUBMIT
  // ============================
  const handleSubmit = async () => {
    if (!title || !content) {
      alert("Title and content are required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);

      files.forEach((file) => {
        formData.append("files", file);
      });

      if (removeFileIds.length > 0) {
        formData.append("removeFileIds", JSON.stringify(removeFileIds));
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-tenant-slug": tenantSlug,
        },
      };

      if (existingData) {
        await api.put(`/knowledge/${existingData.id}`, formData, config);
      } else {
        await api.post("/knowledge/upload", formData, config);
      }

      setSuccess(true);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // 📥 LOAD EXISTING DATA
  // ============================
useEffect(() => {
  if (existingData) {
    setTitle(existingData.title);
    setContent(existingData.content);
    setExistingFiles(existingData.files || []); // ✅ IMPORTANT
  }
}, [existingData]);

  // ============================
  // ❌ REMOVE NEW FILE
  // ============================
  const removeNewFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  // ============================
  // ❌ REMOVE EXISTING FILE
  // ============================
const removeExistingFile = (fileToRemove: any) => {
  setRemoveFileIds(prev => [...prev, fileToRemove.id]);

  setExistingFiles(prev =>
    prev.filter(f => f.file_url !== fileToRemove.file_url)
  );
};

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 w-full max-w-2xl p-8 rounded-2xl relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400"
        >
          ✕
        </button>

        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              {existingData ? "Edit Knowledge Base" : "Upload Knowledge Base"}
            </h1>
            <p className="text-slate-400 text-sm">
              Add training documents for your AI assistant
            </p>
          </div>

          {/* Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 
            border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">

            {/* Title */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Document Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 
                rounded-xl text-white focus:outline-none focus:ring-2 
                focus:ring-purple-500"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Description / Summary
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Short description..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 
                rounded-xl text-white focus:outline-none focus:ring-2 
                focus:ring-purple-500"
              />
            </div>

            {/* Upload */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Upload Files (PDF / Images)
              </label>

              <label className="flex flex-col items-center justify-center 
                border-2 border-dashed border-slate-700 rounded-2xl 
                h-40 cursor-pointer hover:border-purple-500 transition">

                <UploadCloud className="w-8 h-8 text-purple-400 mb-3" />

                <span className="text-slate-400 text-sm">
                  Click to upload or drag & drop
                </span>

                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files;
                    if (selected) {
                      setFiles((prev) => [...prev, ...Array.from(selected)]);
                    }
                  }}
                />
              </label>

              {/* ✅ Existing Files */}
             {existingFiles.length > 0 && (
  <div className="mt-4 space-y-2">
    {existingFiles.map((file: any) => {
      const isImage = file.file_type === "image";

      return (
        <div
          key={file.id}
          className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded-xl"
        >
          <div className="flex items-center gap-3">
            {isImage ? <span>🖼️</span> : <span>📄</span>}

            <div className="text-sm text-white max-w-[200px] truncate">
              {file.file_name || file.file_url.split("/").pop()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-xs underline"
            >
              View
            </a>

       <button
  onClick={() => removeExistingFile(file)}
  className="text-red-400 text-xs"
>
  Remove
</button>
          </div>
        </div>
      );
    })}
  </div>
)}

              {/* ✅ New Files Preview */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        {file.type.startsWith("image") ? (
                          <span className="text-lg">🖼️</span>
                        ) : (
                          <span className="text-lg">📄</span>
                        )}

                        <div className="text-sm text-white">
                          {file.name}
                        </div>
                      </div>

                      <button
                        onClick={() => removeNewFile(index)}
                        className="text-red-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white 
              bg-gradient-to-r from-purple-600 to-blue-600 
              disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? "Processing..."
                : existingData
                ? "Update"
                : "Upload"}
            </button>

            {/* Success */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 
                text-green-400 text-sm px-4 py-3 rounded-xl">
                Document saved successfully 🎉
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}