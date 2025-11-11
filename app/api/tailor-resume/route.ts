import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// ✅ Use Groq API - Free tier with generous limits, no credit card required
// Get your free API key at: https://console.groq.com/
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

export async function POST(request: NextRequest) {
  try {
    // Check for API key first
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is not configured. Please set GROQ_API_KEY in your environment variables. Get a free key at https://console.groq.com/' },
        { status: 500 }
      )
    }

    const { resume, jobDescription } = await request.json()

    if (!jobDescription || !jobDescription.trim()) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      )
    }

    let prompt = ''
    let systemMessage = ''

    if (resume && resume.trim()) {
      // Tailor existing resume to job description
      systemMessage = "You are an expert resume writer who tailors resumes to job descriptions while maintaining the original format and structure."
      prompt = `You are an expert resume writer and career coach. Your task is to tailor the provided resume to match the given job description while PRESERVING ALL FORMATTING ELEMENTS.

Here is the original resume:
${resume}

Here is the job description:
${jobDescription}

CRITICAL FORMATTING REQUIREMENTS - YOU MUST PRESERVE:
1. ALL border lines, divider lines, and separator lines (use characters like ─, │, ═, ║, ┌, ┐, └, ┘, ├, ┤, ┬, ┴, ┼, or simple dashes/equals)
2. ALL column structures and table-like layouts
3. ALL spacing, indentation, and alignment
4. ALL section dividers and horizontal lines between sections
5. The exact visual structure including any boxes, borders, or decorative elements
6. The top section divider that separates name/contact info from the rest
7. ALL formatting characters, spacing patterns, and layout structure

Please tailor the resume to:
1. Highlight relevant skills, experiences, and achievements that match the job requirements
2. Use keywords from the job description naturally throughout the resume
3. Reorder and emphasize sections that are most relevant to the position
4. Adjust the professional summary/objective to align with the role
5. Quantify achievements where possible to match the job's focus areas
6. Keep all factual information accurate - only enhance and rephrase, don't fabricate

CRITICAL: Return ONLY the tailored resume text. Do NOT include any explanations, introductions, or comments like "Here is the tailored resume" or similar phrases. Start directly with the resume content, preserving EXACTLY the same formatting structure, borders, lines, columns, and visual layout as the original. If the original has border lines, divider lines, or structured columns, you MUST include them in the exact same positions. Preserve every formatting character, spacing pattern, and visual element.`
    } else {
      // Generate new resume from job description
      systemMessage = "You are an expert resume writer who creates professional, ATS-friendly resumes based on job descriptions."
      prompt = `You are an expert resume writer. Create a professional, comprehensive resume based on the following job description.

Job Description:
${jobDescription}

Please create a complete resume that includes:
1. A professional summary/objective tailored to this role
2. Relevant skills section matching the job requirements
3. Professional experience section with 3-5 relevant positions (create realistic but generic positions)
4. Education section
5. Any additional relevant sections (certifications, projects, etc.)

Make the resume:
- ATS-friendly (use keywords from the job description)
- Professional and well-formatted
- Comprehensive but concise
- Tailored specifically to this job description
- Use standard resume sections and formatting

Return the resume in plain text format with clear section headers.`
    }

    // Using Groq's free models - Try different model names if one doesn't work
    // Available models: "llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "llama-3-70b-versatile"
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant", // Fast and reliable free model
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4096, // Groq free tier supports this
      temperature: 0.7,
    })

    let tailoredResume = completion.choices[0]?.message?.content
    
    if (!tailoredResume) {
      console.error("No content returned from OpenAI")
      return NextResponse.json(
        { error: "Failed to generate resume. The AI model did not return any content." },
        { status: 500 }
      )
    }
    
    // Clean up any explanatory text that might have been added
    // Remove common AI introduction phrases
    if (tailoredResume) {
      const cleanupPatterns = [
        /^Here is the tailored resume[:\s]*/i,
        /^Here's the tailored resume[:\s]*/i,
        /^The tailored resume[:\s]*/i,
        /^Here is the resume[:\s]*/i,
        /^Here's the resume[:\s]*/i,
        /^Below is the tailored resume[:\s]*/i,
        /^Below is the resume[:\s]*/i,
        /^with exactly the same formatting structure[^\n]*\n/i,
        /^following the same format[^\n]*\n/i,
      ]
      
      cleanupPatterns.forEach(pattern => {
        tailoredResume = tailoredResume!.replace(pattern, '')
      })
      
      // Trim any leading/trailing whitespace
      tailoredResume = tailoredResume.trim()
    }
    
    return NextResponse.json({ tailoredResume })
  } catch (error) {
    console.error("Error tailoring resume - Full error details:", {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    
    // Provide more detailed error messages
    let errorMessage = "An error occurred while processing the resume"
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      errorMessage = error.message // Show actual error first
      
      // Check for specific error types
      if (errorMsg.includes('api key') || errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
        errorMessage = "Invalid or missing API key. Please check your GROQ_API_KEY environment variable. Get a free key at https://console.groq.com/"
      } else if (errorMsg.includes('402') || errorMsg.includes('credits') || errorMsg.includes('payment')) {
        errorMessage = "Groq is completely free! If you see this error, please check your API key at https://console.groq.com/"
      } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        errorMessage = "Rate limit exceeded. Groq free tier has generous limits. Please try again in a moment."
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('econnrefused')) {
        errorMessage = "Network error. Please check your internet connection and try again."
      } else if (errorMsg.includes('model') || errorMsg.includes('not found') || errorMsg.includes('invalid')) {
        errorMessage = `Model error: ${error.message}. The model name might be incorrect. Please check the console logs for details.`
      } else if (errorMsg.includes('timeout')) {
        errorMessage = "Request timed out. Please try again with a shorter resume or job description."
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}