'use client'

import { useState } from 'react'
import { saveAs } from 'file-saver'

interface ResumePreviewProps {
  originalResume: string | null
  tailoredResume: string | null
  isProcessing: boolean
}

type DownloadFormat = 'txt' | 'docx'

export default function ResumePreview({
  originalResume,
  tailoredResume,
  isProcessing,
}: ResumePreviewProps) {
  const [activeTab, setActiveTab] = useState<'original' | 'tailored'>('tailored')
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('docx')
  const [isDownloading, setIsDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDownload = async () => {
    const content = activeTab === 'tailored' ? tailoredResume : originalResume
    if (!content) return

    setIsDownloading(true)

    try {
      if (downloadFormat === 'txt') {
        // Simple text download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const fileName = activeTab === 'tailored' 
          ? 'tailored-resume.txt' 
          : 'original-resume.txt'
        saveAs(blob, fileName)
      } else if (downloadFormat === 'docx') {
        // Use API to generate DOCX
        const response = await fetch('/api/download-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content,
            format: downloadFormat,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate file')
        }

        const blob = await response.blob()
        const fileName = activeTab === 'tailored' 
          ? `tailored-resume.${downloadFormat}` 
          : `original-resume.${downloadFormat}`
        saveAs(blob, fileName)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert(error instanceof Error ? error.message : 'Failed to download file')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyToClipboard = async () => {
    const content = activeTab === 'tailored' ? tailoredResume : originalResume
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const displayContent = activeTab === 'tailored' ? tailoredResume : originalResume

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 h-full flex flex-col border border-blue-200/50 dark:border-blue-700/50 hover:shadow-3xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-500 animate-slide-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>👁️</span>
          Resume Preview
        </h2>
        {displayContent && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 hover:from-gray-600 hover:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-800 text-white rounded-xl text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-2"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <select
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value as DownloadFormat)}
              className="px-4 py-2 border-2 border-indigo-300 dark:border-indigo-600 rounded-xl text-sm font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              disabled={isDownloading}
            >
              <option value="docx">DOCX</option>
              <option value="txt">TXT</option>
            </select>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-300 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 relative overflow-hidden group"
            >
              {!isDownloading && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              )}
              <span className="relative z-10 flex items-center gap-2">
                {isDownloading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </>
                )}
              </span>
            </button>
          </div>
        )}
      </div>

      {originalResume || tailoredResume ? (
        <>
          <div className="flex space-x-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            {originalResume && (
              <button
                onClick={() => setActiveTab('original')}
                className={`
                  px-4 py-2 font-medium text-sm transition-all duration-200 relative
                  ${activeTab === 'original'
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                Original
              </button>
            )}
            {tailoredResume && (
              <button
                onClick={() => setActiveTab('tailored')}
                className={`
                  px-4 py-2 font-medium text-sm transition-all duration-200 relative
                  ${activeTab === 'tailored'
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                Tailored
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {isProcessing && activeTab === 'tailored' ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg
                    className="animate-spin h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-300">AI is tailoring your resume...</p>
                </div>
              </div>
            ) : displayContent ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto max-h-[600px]">
                  {displayContent}
                </pre>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>Upload a resume and tailor it to see the preview here</p>
          </div>
        </div>
      )}
    </div>
  )
}

