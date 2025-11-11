'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ResumeData } from '@/types/resume'

interface ResumeUploadProps {
  onResumeUpload: (data: ResumeData) => void
  onResumeDelete: () => void
  existingResume: ResumeData | null
}

export default function ResumeUpload({ onResumeUpload, onResumeDelete, existingResume }: ResumeUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to parse file')
      }

      const data = await response.json()
      
      const resumeData: ResumeData = {
        content: data.content,
        fileName: data.fileName,
        fileType: data.fileType,
        uploadedAt: new Date().toISOString(),
      }

      onResumeUpload(resumeData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }, [onResumeUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  })

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-indigo-200/50 dark:border-indigo-700/50 hover:shadow-3xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-500 animate-slide-in">
      <div className="mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2 flex items-center gap-2">
          <span className="text-2xl animate-bounce">📄</span>
          Resume Upload <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Upload your resume to tailor it to the job description. If you don't upload a resume, we'll generate a professional one from the job description.
        </p>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-xl p-4 mb-4 shadow-md hover:shadow-lg transition-shadow">
          <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
            <span className="text-lg animate-pulse">💡</span>
            <span><span className="font-bold">Format Preservation:</span> If you upload a resume, the tailored version will maintain the same format, structure, borders, lines, and style as your original resume.</span>
          </p>
        </div>
      </div>
      
      {existingResume && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-600 rounded-xl shadow-md animate-slide-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                <span className="text-xl">✅</span>
                <span><span className="font-bold">Saved Resume:</span> {existingResume.fileName}</span>
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 ml-7">
                Uploaded: {new Date(existingResume.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onResumeDelete}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-2"
              title="Delete saved resume"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-indigo-500 dark:border-indigo-400 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 scale-105 shadow-lg' 
            : 'border-indigo-300 dark:border-indigo-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 hover:shadow-md'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={isProcessing} />
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          {isProcessing ? (
            <div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Processing resume...</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-gray-700 dark:text-gray-200 font-medium">
                  {isDragActive
                    ? 'Drop your resume here'
                    : 'Drag & drop your resume here, or click to select'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Supports PDF, DOC, DOCX, and TXT files
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Note: Old .doc files may have limited support. For best results, use .docx or PDF format.
                </p>
              </div>
              {existingResume && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  Upload a new resume to replace the saved one
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

