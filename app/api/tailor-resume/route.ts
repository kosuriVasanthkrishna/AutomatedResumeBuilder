// app/api/tailor-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

// Helper function to load .env.local manually if Next.js didn't load it
function loadEnvLocal() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Only set if not already in process.env
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
    console.log('Manually loaded .env.local file');
  } catch (error) {
    // File doesn't exist or can't be read - that's okay, Next.js should handle it
    console.log('Could not manually load .env.local (this is normal if Next.js already loaded it)');
  }
}

// Try to load .env.local if env vars are missing
if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
  loadEnvLocal();
}

// Helper function to extract years of experience requirement from JD
function extractExperienceYears(jd: string): number | null {
  const patterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi,
    /(\d+)\+?\s*years?\s*(?:in|with)/gi,
    /minimum\s*(?:of\s*)?(\d+)\s*years?/gi,
    /at\s*least\s*(\d+)\s*years?/gi,
  ];

  for (const pattern of patterns) {
    const matches = jd.match(pattern);
    if (matches) {
      const years = matches.map(m => {
        const numMatch = m.match(/(\d+)/);
        return numMatch ? parseInt(numMatch[1], 10) : 0;
      });
      return Math.max(...years);
    }
  }
  return null;
}

// Helper function to check if JD mentions projects
function mentionsProjects(jd: string): boolean {
  const lowerJd = jd.toLowerCase();
  return lowerJd.includes('project') || lowerJd.includes('portfolio') || 
         lowerJd.includes('github') || lowerJd.includes('code sample');
}

// Helper function to extract information from user's resume
function extractResumeInfo(resumeText: string): {
  name?: string;
  email?: string;
  phone?: string;
  experience?: string[];
  projects?: string[];
  skills?: string[];
  education?: string[];
} {
  const info: any = {};
  const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l);
  
  // Extract contact info
  const emailMatch = resumeText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) info.email = emailMatch[0];
  
  const phoneMatch = resumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) info.phone = phoneMatch[0];
  
  // Extract name (usually first line or before email)
  if (lines.length > 0 && !lines[0].includes('@') && !lines[0].match(/\d{3}/)) {
    info.name = lines[0].split(/\s+/).slice(0, 2).join(' ');
  }
  
  // Extract experience sections
  let inExperience = false;
  const experience: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('experience') || lower.includes('employment') || lower.includes('work history')) {
      inExperience = true;
      continue;
    }
    if (inExperience && (lower.includes('education') || lower.includes('skill') || lower.includes('project'))) {
      break;
    }
    if (inExperience && line.length > 20) {
      experience.push(line);
    }
  }
  info.experience = experience.slice(0, 10);
  
  // Extract projects
  let inProjects = false;
  const projects: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('project')) {
      inProjects = true;
      continue;
    }
    if (inProjects && (lower.includes('education') || lower.includes('skill') || lower.includes('experience'))) {
      break;
    }
    if (inProjects && line.length > 15) {
      projects.push(line);
    }
  }
  info.projects = projects.slice(0, 5);
  
  return info;
}

// Generate AI-powered resume using Groq (primary) or OpenAI (fallback)
async function generateResumeWithAI(
  jobDescription: string,
  existingResume?: string
): Promise<string> {
  // Check environment variables (works for both local .env.local and Vercel environment variables)
  // Note: Do NOT use NEXT_PUBLIC_ prefix for API keys as they get exposed to client
  // In Next.js, environment variables are loaded at build/start time, not runtime
  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
  
  // Debug logging (without exposing the actual key)
  console.log('Environment check:', {
    hasGroqKey: !!groqApiKey,
    groqKeyLength: groqApiKey ? groqApiKey.length : 0,
    groqKeyPrefix: groqApiKey ? groqApiKey.substring(0, 4) : 'none',
    hasOpenAIKey: !!openaiApiKey,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('GROQ') || k.includes('OPENAI')),
  });
  
  if (!groqApiKey && !openaiApiKey) {
    // Detect if we're on Vercel
    const isVercel = !!process.env.VERCEL;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Provide detailed troubleshooting information
    const troubleshooting = isVercel ? `
VERCEL DEPLOYMENT TROUBLESHOOTING:

1. **Add Environment Variable in Vercel:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Click "Add New"
   - Name: GROQ_API_KEY
   - Value: Your Groq API key (starts with gsk_)
   - IMPORTANT: Select ALL environments (Production, Preview, Development)
   - Click "Save"

2. **Redeploy After Adding:**
   - Go to Deployments tab
   - Click the three dots (⋯) on latest deployment
   - Click "Redeploy"
   - OR push a new commit to trigger redeploy

3. **Verify Environment Variable:**
   - Check that GROQ_API_KEY is listed in Environment Variables
   - Make sure it's enabled for Production environment
   - The value should start with "gsk_"

4. **Check Deployment Logs:**
   - Go to your deployment in Vercel
   - Check the "Logs" tab for any errors
   - Look for environment variable loading messages

Current environment check:
- Running on Vercel: ${isVercel}
- Environment: ${process.env.NODE_ENV || 'unknown'}
- Has GROQ_API_KEY: ${!!groqApiKey}
- Has OPENAI_API_KEY: ${!!openaiApiKey}
- All env vars with GROQ/OPENAI: ${Object.keys(process.env).filter(k => k.includes('GROQ') || k.includes('OPENAI')).join(', ') || 'none found'}
- Vercel env vars: ${Object.keys(process.env).filter(k => k.startsWith('VERCEL')).join(', ') || 'none'}
` : `
LOCAL DEVELOPMENT TROUBLESHOOTING:

1. **Check .env.local file exists:**
   - File should be in the root directory (same level as package.json)
   - File name must be exactly: .env.local (not .env or .env.local.txt)

2. **Verify file format:**
   - Should be: GROQ_API_KEY=your_key_here
   - No spaces around the = sign
   - No quotes needed
   - Key should start with "gsk_" for Groq

3. **RESTART YOUR DEV SERVER:**
   - Stop the server (Ctrl+C or Cmd+C)
   - Run: npm run dev
   - Next.js only loads .env.local on server startup

4. **Check for typos:**
   - Variable name must be exactly: GROQ_API_KEY
   - Check for extra spaces or hidden characters

5. **Verify the key:**
   - Get a new key from: https://console.groq.com/
   - Make sure you copied the entire key

Current environment check:
- Has GROQ_API_KEY: ${!!groqApiKey}
- Has OPENAI_API_KEY: ${!!openaiApiKey}
- All env vars with GROQ/OPENAI: ${Object.keys(process.env).filter(k => k.includes('GROQ') || k.includes('OPENAI')).join(', ') || 'none found'}
`;
    
    throw new Error(
      'AI API key not configured. Please set GROQ_API_KEY or OPENAI_API_KEY in your environment variables.\n\n' +
      (isVercel 
        ? 'For Vercel: Go to Project Settings > Environment Variables > Add GROQ_API_KEY > Redeploy\n'
        : 'For local development: Add to .env.local file (format: GROQ_API_KEY=your_key_here)\n') +
      'Get a free Groq API key at: https://console.groq.com/\n' +
      'Or use OpenAI API key from: https://platform.openai.com/api-keys\n\n' +
      troubleshooting
    );
  }
  
  // Validate API key format
  if (groqApiKey && groqApiKey.length < 20) {
    throw new Error(`GROQ_API_KEY appears to be invalid (length: ${groqApiKey.length}, expected at least 20). Please check your API key. It should start with "gsk_" for Groq API keys.`);
  }
  
  if (groqApiKey && !groqApiKey.startsWith('gsk_')) {
    console.warn('Warning: GROQ_API_KEY does not start with "gsk_". This might not be a valid Groq API key.');
  }
  
  const hasResume = existingResume && existingResume.trim().length > 0;
  const resumeInfo = hasResume ? extractResumeInfo(existingResume) : {};
  const experienceYears = extractExperienceYears(jobDescription);
  const needsProjects = mentionsProjects(jobDescription);
  
  // Build comprehensive prompt
  let systemPrompt = `You are an expert resume writer and ATS (Applicant Tracking System) specialist with deep knowledge of how real professionals describe their work. Your task is to create a complete, professional, ATS-friendly resume that perfectly matches the job description. 

CRITICAL: Generate ONLY realistic, believable content that sounds authentic. Avoid generic phrases, overly perfect achievements, or anything that sounds fabricated. Think like a real professional would when describing their actual work experience.`;
  
  let userPrompt = `Create a complete, professional, ATS-friendly resume based on the following job description:\n\n${jobDescription}\n\n`;
  
  if (hasResume) {
    userPrompt += `IMPORTANT: The user has provided their existing resume. You MUST tailor and improve it to match the job description. Here's the existing resume content:\n\n${existingResume}\n\n`;
    userPrompt += `Extract and use the following information from the existing resume:\n`;
    userPrompt += `- Name: ${resumeInfo.name || '[Not found - use [Your Name]]'}\n`;
    userPrompt += `- Email: ${resumeInfo.email || '[Not found - use [your.email@example.com]]'}\n`;
    userPrompt += `- Phone: ${resumeInfo.phone || '[Not found - use [Your Phone Number]]'}\n`;
    if (resumeInfo.experience && resumeInfo.experience.length > 0) {
      userPrompt += `- Previous Experience: ${resumeInfo.experience.join('; ')}\n`;
    }
    if (resumeInfo.projects && resumeInfo.projects.length > 0) {
      userPrompt += `- Projects: ${resumeInfo.projects.join('; ')}\n`;
    }
    userPrompt += `\nCRITICAL: Do NOT just return the original resume. You MUST:\n`;
    userPrompt += `1. Tailor all experience bullet points to match keywords and requirements from the job description\n`;
    userPrompt += `2. Reorder sections to highlight most relevant experience first\n`;
    userPrompt += `3. Add missing skills mentioned in the job description\n`;
    userPrompt += `4. Rewrite the professional summary to align with the job requirements\n`;
    userPrompt += `5. Enhance achievements with quantifiable metrics where possible\n`;
    userPrompt += `6. Use the real information from the resume where available. For missing details, use brackets like [Your Name], [your.email@example.com], etc.\n\n`;
  } else {
    userPrompt += `The user has NOT provided a resume. Generate a complete, realistic resume from scratch based on the job description.\n\n`;
  }
  
  userPrompt += `\nCRITICAL REQUIREMENTS FOR REALISTIC, AUTHENTIC CONTENT:\n\n`;
  userPrompt += `1. **REALISTIC COMPANY NAMES & EXPERIENCE:**\n`;
  userPrompt += `   - Use believable company names (not "Tech Corp" or "ABC Company")\n`;
  userPrompt += `   - Think of real-sounding companies: mid-size tech firms, consulting companies, startups, established corporations\n`;
  userPrompt += `   - Company names should vary in style (some with "Solutions", "Systems", "Technologies", or just names)\n`;
  userPrompt += `   - Dates should be realistic and show career progression (e.g., 2021-2024, 2019-2021, etc.)\n\n`;
  
  userPrompt += `2. **AUTHENTIC ACHIEVEMENTS & METRICS:**\n`;
  userPrompt += `   - Use realistic, believable metrics (not "increased revenue by 1000%" or "saved $10 million")\n`;
  userPrompt += `   - Typical improvements: 15-35% efficiency gains, 20-40% cost reductions, 10-25% performance improvements\n`;
  userPrompt += `   - Use specific but believable numbers: "reduced processing time by 28%", "improved user engagement by 22%", "decreased costs by $150K annually"\n`;
  userPrompt += `   - Include a mix: some with metrics, some describing responsibilities (real resumes aren't 100% metrics)\n`;
  userPrompt += `   - Avoid round numbers like "50%" or "100%" - use specific numbers like "47%" or "23%"\n\n`;
  
  userPrompt += `3. **NATURAL LANGUAGE & DESCRIPTIONS:**\n`;
  userPrompt += `   - Write like a real professional would describe their work\n`;
  userPrompt += `   - Use varied action verbs: "Developed", "Implemented", "Collaborated", "Optimized", "Led", "Designed", "Architected"\n`;
  userPrompt += `   - Include realistic challenges and solutions, not just perfect outcomes\n`;
  userPrompt += `   - Some bullets should describe responsibilities, not just achievements\n`;
  userPrompt += `   - Avoid buzzword overload - use technical terms naturally\n`;
  userPrompt += `   - Make it sound like someone actually did this work, not like marketing copy\n\n`;
  
  userPrompt += `4. **REALISTIC PROJECTS (if needed):**\n`;
  userPrompt += `   - Project names should sound real: "E-commerce Platform Optimization", "Customer Analytics Dashboard", "API Gateway Migration"\n`;
  userPrompt += `   - Describe actual technical challenges and solutions\n`;
  userPrompt += `   - Include realistic tech stacks that make sense together\n`;
  userPrompt += `   - Mention real-world constraints and how they were addressed\n`;
  userPrompt += `   - Avoid overly ambitious or impossible-sounding projects\n\n`;
  
  userPrompt += `5. **CAREER PROGRESSION:**\n`;
  userPrompt += `   - Show logical career growth: Junior → Mid-level → Senior roles\n`;
  userPrompt += `   - ${experienceYears ? `Create ${experienceYears}+ years of experience with appropriate progression` : 'Create appropriate experience progression'}\n`;
  userPrompt += `   - Each role should build on previous experience\n`;
  userPrompt += `   - Responsibilities should increase with seniority\n`;
  userPrompt += `   - Include 3-4 positions showing career growth\n\n`;
  
  userPrompt += `6. **TECHNICAL DETAILS:**\n`;
  userPrompt += `   - Use specific technologies mentioned in the job description\n`;
  userPrompt += `   - Include realistic tech combinations (e.g., React + Node.js + PostgreSQL, not random mixes)\n`;
  userPrompt += `   - Mention tools and frameworks that professionals actually use\n`;
  userPrompt += `   - Show depth in key technologies, not just a list of everything\n\n`;
  
  userPrompt += `7. **FORMATTING & STRUCTURE:**\n`;
  userPrompt += `   - Use standard ATS-friendly section headers: Professional Summary, Professional Experience, Education, Skills, Projects\n`;
  userPrompt += `   - Professional Summary: 3-4 sentences, specific to the role, not generic\n`;
  userPrompt += `   - Each experience entry: Company name, location, dates, 4-6 bullet points\n`;
  userPrompt += `   - Education: Realistic degrees and institutions\n`;
  userPrompt += `   - Skills: Organized by category (Programming Languages, Frameworks, Tools, etc.)\n\n`;
  
  userPrompt += `8. **AUTHENTICITY CHECKLIST:**\n`;
  userPrompt += `   - Would a real person write this? (Yes/No)\n`;
  userPrompt += `   - Does this sound like actual work experience? (Yes/No)\n`;
  userPrompt += `   - Are the achievements believable? (Yes/No)\n`;
  userPrompt += `   - Would a recruiter believe this? (Yes/No)\n`;
  userPrompt += `   - If any answer is No, rewrite to be more realistic\n\n`;
  
  userPrompt += `9. **PERSONAL INFORMATION:**\n`;
  userPrompt += `   - Use brackets for user details: [Your Name], [your.email@example.com], [Your Phone Number], [City, State]\n`;
  userPrompt += `   - Keep all other content complete and realistic\n\n`;
  
  userPrompt += `10. **FINAL INSTRUCTIONS:**\n`;
  userPrompt += `    - Generate a complete resume that reads like a real professional's actual experience\n`;
  userPrompt += `    - Every line should sound authentic and believable\n`;
  userPrompt += `    - Avoid anything that sounds like AI-generated content or marketing speak\n`;
  userPrompt += `    - Make it so realistic that if someone reads it, they'll think "this person has real experience"\n`;
  userPrompt += `    - Think critically about each bullet point: "Would I actually say this about my work?"\n\n`;
  
  userPrompt += `Generate the complete, authentic, realistic resume now. Make it believable and professional.`;
  
  // Try Groq first (primary), then OpenAI as fallback
  if (groqApiKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', // Updated from deprecated llama-3.1-70b-versatile
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8, // Slightly higher for more natural, varied output
          max_tokens: 4000, // Increased for more detailed, realistic content
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', response.status, errorText);
        let errorMessage = `Groq API error: ${response.status} ${response.statusText}`;
        
        // Provide helpful error messages for common issues
        if (response.status === 401) {
          errorMessage = 'Invalid GROQ_API_KEY. Please check your API key in .env.local file.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
        } else if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
              errorMessage = `Groq API error: ${errorData.error.message}`;
            }
          } catch {
            // If parsing fails, use the original error text
            errorMessage = `Groq API error: ${errorText.substring(0, 200)}`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      if (!content || content.trim().length === 0) {
        throw new Error('Empty response from Groq API');
      }
      
      return content;
    } catch (error: any) {
      console.error('Groq error:', error);
      // If Groq fails and OpenAI is available, try OpenAI
      if (openaiApiKey) {
        console.log('Falling back to OpenAI...');
      } else {
        throw new Error(`Failed to generate resume with Groq: ${error.message || 'Unknown error'}. Please check your GROQ_API_KEY.`);
      }
    }
  }
  
  // Try OpenAI as fallback
  if (openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8, // Slightly higher for more natural, varied output
        max_tokens: 4000, // Increased for more detailed, realistic content
      });
      
      const content = completion.choices[0]?.message?.content || '';
      
      if (!content || content.trim().length === 0) {
        throw new Error('Empty response from OpenAI API');
      }
      
      return content;
    } catch (error: any) {
      console.error('OpenAI error:', error);
      throw new Error(`Failed to generate resume with OpenAI: ${error.message || 'Unknown error'}. Please check your API keys.`);
    }
  }
  
  throw new Error('No AI API key available. Please configure GROQ_API_KEY or OPENAI_API_KEY.');
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!jobDescription || !jobDescription.trim()) {
      return NextResponse.json(
        { error: "Missing jobDescription" },
        { status: 400 }
      );
    }

    const resumeContent = (resumeText || '').trim();
    const jd = jobDescription.trim();
    
    // Check if we have actual resume content (not empty and not the same as job description)
    const hasResume = resumeContent && resumeContent.length > 0 && resumeContent !== jd;
    
    // Generate AI-powered resume
    const tailored = await generateResumeWithAI(jd, hasResume ? resumeContent : undefined);

    if (!tailored || tailored.trim().length === 0) {
      return NextResponse.json(
        { error: "Failed to generate resume. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, tailored });
  } catch (err: any) {
    console.error("tailor-resume error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error occurred while generating resume" },
      { status: 500 }
    );
  }
}
