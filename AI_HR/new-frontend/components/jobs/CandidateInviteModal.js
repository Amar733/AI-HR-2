import React, { useState, useRef, useCallback } from "react";
import {
  Modal,
  Button,
  Alert,
  Table,
  ProgressBar,
  Badge,
} from "react-bootstrap";
import api from "../../services/api";
import { toast } from "react-toastify";

// Allowed file MIME types (best-effort) and extensions fallback
const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

export default function CandidateInviteModal({
  show,
  onHide,
  jobId,
  jobTitle,
  onInviteComplete,
}) {
  const [files, setFiles] = useState([]); // { id, file, progress, status, error }
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);

  // --- Helpers ---
  const uid = (file) => `${file.name}-${file.size}-${file.lastModified}`;
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isAllowed = (file) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeOk = ALLOWED_MIME.includes(file.type);
    const extOk = ["pdf", "doc", "docx"].includes(ext);
    return (mimeOk || extOk) && file.size <= MAX_FILE_SIZE;
  };

  const addFiles = useCallback(
    (incomingFiles) => {
      const arr = Array.from(incomingFiles);
      const validated = [];

      for (const f of arr) {
        const id = uid(f);
        if (!isAllowed(f)) {
          toast.error(
            `${f.name} is not allowed or exceeds ${formatBytes(MAX_FILE_SIZE)}`
          );
          continue;
        }
        // avoid duplicates
        if (
          files.some((x) => x.id === id) ||
          validated.some((x) => x.id === id)
        )
          continue;

        validated.push({
          id,
          file: f,
          progress: 0,
          status: "ready",
          error: null,
        });
      }

      if (validated.length === 0) return;
      setFiles((prev) => [...prev, ...validated]);
    },
    [files]
  );

  // Drag & Drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dtFiles = e.dataTransfer?.files;
    if (dtFiles && dtFiles.length) addFiles(dtFiles);
    if (dropRef.current) dropRef.current.classList.remove("drag-over");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.add("drag-over");
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.remove("drag-over");
  };

  const handleFileSelect = (e) => {
    const inputFiles = e.target.files;
    if (inputFiles && inputFiles.length) addFiles(inputFiles);
    e.target.value = null;
  };

  const removeFile = (id) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));
  const clearAll = () => setFiles([]);

  // --- Bulk upload handler ---
  // --- Bulk upload handler ---
  const handleBulkInvite = async () => {
    if (!files.length) {
      toast.error("Please add at least one file to upload");
      return;
    }

    const toUpload = files.filter((f) => f.status === "ready");
    if (!toUpload.length) {
      toast.error("No ready files to upload");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      toUpload.forEach((f) => formData.append("files", f.file));
      formData.append("jobId", jobId);

      // Make sure your backend accepts POST /jobs/bulk-upload-files
      const url = `/jobs/bulk-upload-files`;
      const data = await api.post(url, formData, {
        // IMPORTANT: do NOT set Content-Type here. Let the browser/axios set it (so boundary is included).
        onUploadProgress: (progressEvent) => {
          // guard against progressEvent.total === 0
          const total = progressEvent.total || 1;
          const pct = Math.round((progressEvent.loaded * 100) / total);
          setFiles((prev) =>
            prev.map((p) =>
              p.status === "ready" ? { ...p, progress: pct } : p
            )
          );
        },
      });

      toast.success(
        data.message || `Uploaded ${toUpload.length} file(s) successfully`
      );

      // Mark uploaded files as done
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "ready" ? { ...f, status: "done", progress: 100 } : f
        )
      );

      onInviteComplete?.();
      onHide();
      clearAll();
    } catch (error) {
      console.error("Bulk upload error", error);
      // mark files with error
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "ready"
            ? { ...f, status: "error", error: error.message || "Upload failed" }
            : f
        )
      );
      toast.error(error.message || "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-person-plus me-2"></i>
          Invite Candidates to {jobTitle}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Alert variant="info" className="mb-4">
          <Alert.Heading>📧 Interview Invitations</Alert.Heading>
          <p className="mb-0">
            Upload PDF/DOC/DOCX resumes or candidate batches. We automatically
            extract each candidate's skills and experience, compare them to this
            job's requirements, and surface a match score with highlighted
            matching skills — so you can review the best-fit resumes and then
            send invitations to the top candidates.
          </p>
        </Alert>

        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="border rounded p-4 text-center mb-3"
          style={{ cursor: "pointer", background: "#fbfbfb" }}
        >
          <input
            type="file"
            id="bulk-file-input"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          <div>
            <p className="mb-2">Drag & drop PDF / DOC / DOCX files here, or</p>
            <label
              htmlFor="bulk-file-input"
              className="btn btn-outline-primary btn-sm"
            >
              <i className="bi bi-upload me-1"></i>
              Select Files
            </label>
          </div>

          <small className="d-block mt-2 text-muted">
            Max file size: {formatBytes(MAX_FILE_SIZE)} each.
          </small>
        </div>

        {files.length > 0 ? (
          <div>
            <Table hover size="sm">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th style={{ width: 200 }}>Progress</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id}>
                    <td>{f.file.name}</td>
                    <td>{formatBytes(f.file.size)}</td>
                    <td>
                      {f.status === "ready" && (
                        <Badge bg="secondary">Ready</Badge>
                      )}
                      {f.status === "done" && (
                        <Badge bg="success">Uploaded</Badge>
                      )}
                      {f.status === "error" && <Badge bg="danger">Error</Badge>}
                    </td>
                    <td>
                      <ProgressBar now={f.progress} label={`${f.progress}%`} />
                      {f.error && (
                        <div className="text-danger small mt-1">{f.error}</div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2 justify-content-end">
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => removeFile(f.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between">
              <div>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={clearAll}
                >
                  Clear
                </Button>
              </div>
              <div>
                <Button
                  variant="outline-secondary"
                  onClick={onHide}
                  className="me-2"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBulkInvite}
                  disabled={loading}
                  className="gradient-btn"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-2"></i>
                      Send Bulk Invitations
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Alert variant="secondary">
            <h6>Upload Instructions</h6>
            <ul className="mb-0">
              <li>Drop or select one or more files</li>
              <li>
                Allowed: <code>pdf</code>, <code>doc</code>, <code>docx</code>
              </li>
              <li>Maximum file size: {formatBytes(MAX_FILE_SIZE)} each</li>
            </ul>
          </Alert>
        )}
      </Modal.Body>
    </Modal>
  );
}
