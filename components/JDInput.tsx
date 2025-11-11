'use client'

import { useState } from 'react'

interface JDInputProps {
  jobDescription: string
  onJobDescriptionChange: (jd: string) => void
  onTailorResume: () => void
  isProcessing: boolean
  hasResume: boolean
}

export default function JDInput({
  jobDescription,
  onJobDescriptionChange,
  onTailorResume,
  isProcessing,
  hasResume,
}: JDInputProps) {
  const [wordCount, setWordCount] = useState(0)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    onJobDescriptionChange(value)
    setWordCount(value.trim().split(/\s+/).filter(Boolean).length)
  }

  const handleClear = () => {
    onJobDescriptionChange('')
    setWordCount(0)
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-purple-200/50 dark:border-purple-700/50 hover:shadow-3xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-500 animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>💼</span>
          Job Description
        </h2>
        {jobDescription && (
          <button
            onClick={handleClear}
            disabled={isProcessing}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Clear job description"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="jd-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Paste the job description here
          </label>
          <textarea
            id="jd-input"
            value={jobDescription}
            onChange={handleChange}
            placeholder="Paste the complete job description, including requirements, responsibilities, and qualifications..."
            className="w-full h-64 px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 dark:focus:border-purple-500 resize-none transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-purple-300 dark:hover:border-purple-600"
            disabled={isProcessing}
          />
          <div className="mt-2 flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {wordCount} words
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {jobDescription.length} characters
            </p>
          </div>
        </div>

        <button
          onClick={onTailorResume}
          disabled={!jobDescription.trim() || isProcessing}
          className={`
            w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 text-lg relative overflow-hidden group
            ${!jobDescription.trim() || isProcessing
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 active:scale-95'
            }
          `}
        >
          {!isProcessing && jobDescription.trim() && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
          )}
          <span className="relative z-10 flex items-center justify-center">
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                {hasResume ? 'Tailoring Resume...' : 'Generating Resume...'}
              </>
            ) : (
              <>
                {hasResume ? '✨ Tailor Resume to JD' : '✨ Generate Resume from JD'}
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

