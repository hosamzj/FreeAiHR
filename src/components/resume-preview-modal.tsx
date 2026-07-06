'use client';

import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/modal';

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  candidatePosition?: string;
  resumeUrl?: string;
  onUploadSuccess?: () => void;
}

export function ResumePreviewModal({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  candidatePosition,
  resumeUrl,
  onUploadSuccess,
}: ResumePreviewModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasResume = !!resumeUrl;
  const isPdf = resumeUrl?.toLowerCase().endsWith('.pdf');
  const isImage = resumeUrl?.match(/\.(jpg|jpeg|png|gif)$/i);
  const isWord = resumeUrl?.match(/\.(doc|docx)$/i);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif',
                          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('不支持的文件格式，仅支持 PDF、Word、图片');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('文件大小不能超过 10MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/candidates/${candidateId}/resume`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.code !== 0) {
        setUploadError(data.message || '上传失败');
        return;
      }

      onUploadSuccess?.();
    } catch (err) {
      setUploadError('上传失败，请重试');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = () => {
    if (!resumeUrl) return;
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.download = `${candidateName}_简历`;
    link.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white font-semibold">
            {candidateName.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{candidateName}</h3>
            {candidatePosition && (
              <p className="text-sm text-slate-400">应聘: {candidatePosition}</p>
            )}
          </div>
        </div>
      }
      size="xl"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="space-y-4">
        {hasResume ? (
          <>
            {/* Resume Preview */}
            <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
              {isPdf ? (
                <iframe
                  src={resumeUrl}
                  className="w-full h-[500px]"
                  title="简历预览"
                />
              ) : isImage ? (
                <div className="p-4 flex justify-center">
                  <img
                    src={resumeUrl}
                    alt="简历"
                    className="max-w-full max-h-[500px] object-contain rounded"
                  />
                </div>
              ) : isWord ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-300 mb-4">Word 文档无法直接预览</p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 transition-colors"
                  >
                    下载查看
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-slate-400">不支持预览此文件格式</p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 px-4 py-2 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 transition-colors"
                  >
                    下载文件
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleUploadClick}
                disabled={uploading}
                className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {uploading ? '上传中...' : '重新上传'}
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 transition-colors"
              >
                下载简历
              </button>
            </div>
          </>
        ) : (
          /* No Resume - Upload Prompt */
          <div className="py-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-white mb-2">暂无原始简历</h4>
            <p className="text-slate-400 mb-6">
              该候选人暂无上传的原始简历文件<br />
              您可以上传 PDF、Word 或图片格式的简历
            </p>
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  上传中...
                </span>
              ) : (
                '上传简历'
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {uploadError}
          </div>
        )}
      </div>
    </Modal>
  );
}
