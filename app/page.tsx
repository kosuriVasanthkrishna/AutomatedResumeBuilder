'use client'

import { useState, useEffect } from 'react'
import ResumeUpload from '@/components/ResumeUpload'
import JDInput from '@/components/JDInput'
import ResumePreview from '@/components/ResumePreview'
import ThemeToggle from '@/components/ThemeToggle'
import { ResumeData } from '@/types/resume'

export default function Home() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [jobDescription, setJobDescription] = useState<string>('')
  const [tailoredResume, setTailoredResume] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load saved resume on mount
  useEffect(() => {
    const savedResume = localStorage.getItem('savedResume')
    if (savedResume) {
      try {
        setResumeData(JSON.parse(savedResume))
      } catch (e) {
        console.error('Error loading saved resume:', e)
      }
    }
  }, [])

  // Save resume when it changes
  useEffect(() => {
    if (resumeData) {
      localStorage.setItem('savedResume', JSON.stringify(resumeData))
    }
  }, [resumeData])

  const handleResumeUpload = (data: ResumeData) => {
    setResumeData(data)
    setError(null)
  }

  const handleResumeDelete = () => {
    setResumeData(null)
    setTailoredResume(null)
    localStorage.removeItem('savedResume')
    setError(null)
  }

  const handleTailorResume = async () => {
    if (!jobDescription.trim()) {
      setError('Please provide a job description')
      return
    }

    setIsProcessing(true)
    setError(null)
    setTailoredResume(null)

    try {
      const response = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: resumeData?.content || '',
          jobDescription: jobDescription,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process resume')
      }

      const data = await response.json()
      setTailoredResume(data.tailored)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:via-purple-950 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Premium animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 dark:from-purple-600/20 dark:to-pink-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-blue-400/30 dark:from-indigo-600/20 dark:to-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-teal-400/30 dark:from-cyan-600/20 dark:to-teal-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Theme Toggle Button - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 animate-slide-in">
          <div className="inline-block mb-6">
            <h1 className="text-6xl sm:text-7xl font-black bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-4 tracking-tight">
              Automated Resume Builder
            </h1>
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 rounded-full mt-2"></div>
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-3xl animate-bounce">✨</span>
            <p className="text-xl sm:text-2xl text-gray-800 dark:text-gray-200 max-w-3xl mx-auto font-semibold leading-relaxed">
              Upload your resume to tailor it to any job description, or generate a professional resume from just the job description using AI
            </p>
            <span className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🚀</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          <div className="space-y-6">
            <ResumeUpload
              onResumeUpload={handleResumeUpload}
              onResumeDelete={handleResumeDelete}
              existingResume={resumeData}
            />
            <JDInput
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              onTailorResume={handleTailorResume}
              isProcessing={isProcessing}
              hasResume={!!resumeData}
            />
          </div>

          <div>
            <ResumePreview
              originalResume={resumeData?.content || null}
              tailoredResume={tailoredResume}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {error && (
          <div className="max-w-7xl mx-auto animate-slide-in">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-2 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200 px-6 py-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-pulse">⚠️</span>
                <div>
                  <p className="font-bold text-lg">Error:</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-20 mb-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          Developed by <span className="text-indigo-600 dark:text-indigo-400 font-bold">Vasanth Krishna Kosuri</span>
        </p>
      </footer>
    </main>
  )
}

