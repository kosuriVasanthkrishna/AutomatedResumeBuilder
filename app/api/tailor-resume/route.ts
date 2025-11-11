// app/api/tailor-resume/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Helper function to extract keywords/skills from job description
function extractKeywords(text: string): string[] {
  const commonTechSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
    'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Git', 'Agile', 'Scrum',
    'Machine Learning', 'AI', 'Data Science', 'Cloud Computing', 'DevOps',
    'HTML', 'CSS', 'Angular', 'Vue', 'Express', 'REST API', 'GraphQL',
    'PostgreSQL', 'MySQL', 'Redis', 'Linux', 'CI/CD', 'Microservices'
  ];
  
  const keywords: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Check for common tech skills
  for (const skill of commonTechSkills) {
    if (lowerText.includes(skill.toLowerCase())) {
      keywords.push(skill);
    }
  }
  
  // Extract words that look like skills (capitalized, 2-20 chars, not common words)
  const words = text.match(/\b[A-Z][a-z]{2,20}\b/g) || [];
  const commonWords = ['The', 'This', 'That', 'With', 'From', 'Your', 'Will', 'Should', 'Must', 'Have', 'Are', 'Can', 'May'];
  const uniqueWords = Array.from(new Set(words.filter(w => !commonWords.includes(w))));
  
  // Add unique capitalized words that might be skills
  uniqueWords.slice(0, 10).forEach(word => {
    if (!keywords.includes(word) && word.length > 2) {
      keywords.push(word);
    }
  });
  
  return keywords.slice(0, 15);
}

// Helper function to generate qualifications from job description
function generateQualifications(jd: string): string {
  const lines = jd.split('\n').filter((l: string) => l.trim());
  const qualifications: string[] = [];
  
  // Look for requirements/qualifications section
  let inRequirementsSection = false;
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('requirement') || lowerLine.includes('qualification') || 
        lowerLine.includes('must have') || lowerLine.includes('should have')) {
      inRequirementsSection = true;
      continue;
    }
    
    if (inRequirementsSection) {
      // Stop if we hit a new section
      if (lowerLine.includes('responsibilit') || lowerLine.includes('benefit') || 
          lowerLine.includes('about') || lowerLine.includes('company')) {
        break;
      }
      
      // Extract bullet points or numbered items
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') ||
          /^\d+[\.\)]/.test(trimmed)) {
        const clean = trimmed.replace(/^[•\-\*\d\.\)\s]+/, '').trim();
        if (clean.length > 10 && clean.length < 150) {
          qualifications.push(clean);
        }
      }
      
      if (qualifications.length >= 5) break;
    }
  }
  
  // If no structured requirements found, create generic ones
  if (qualifications.length === 0) {
    return `• Strong problem-solving and analytical skills
• Excellent communication and teamwork abilities
• Proven track record of delivering results
• Adaptable and quick learner
• Detail-oriented with strong organizational skills`;
  }
  
  return qualifications.map(q => `• ${q}`).join('\n');
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
    
    let tailored = '';
    
    // Check if we have actual resume content (not empty and not the same as job description)
    const hasResume = resumeContent && resumeContent.length > 0 && resumeContent !== jd;
    
    if (hasResume) {
      // If resume exists, return it (in future, this would be AI-tailored)
      tailored = resumeContent;
    } else {
      // Generate a resume template from job description
      // Extract job title and key requirements
      const lines = jd.split('\n').filter((l: string) => l.trim());
      const firstLine = lines[0] || '';
      
      // Try to extract job title (common patterns)
      let jobTitle = 'Professional';
      if (firstLine.length > 0 && firstLine.length < 100) {
        // Check if first line looks like a job title
        if (!firstLine.toLowerCase().includes('description') && 
            !firstLine.toLowerCase().includes('requirements') &&
            !firstLine.toLowerCase().includes('responsibilities')) {
          jobTitle = firstLine;
        }
      }
      
      // Extract skills/keywords from job description
      const skillsKeywords = extractKeywords(jd);
      
      // Generate professional resume template
      tailored = `PROFESSIONAL RESUME

${jobTitle.toUpperCase()}

PROFESSIONAL SUMMARY
Experienced professional seeking ${jobTitle} position. ${skillsKeywords.length > 0 ? `Proficient in ${skillsKeywords.slice(0, 3).join(', ')}.` : 'Ready to contribute to your team.'}

KEY QUALIFICATIONS
${generateQualifications(jd)}

PROFESSIONAL EXPERIENCE

[Your Most Recent Position Title]
[Company Name] | [Location] | [Date Range]
• [Quantify your achievements - e.g., "Increased efficiency by 25%"]
• [Use keywords from the job description]
• [Highlight relevant accomplishments]

[Previous Position Title]
[Company Name] | [Location] | [Date Range]
• [Relevant achievement]
• [Another achievement]
• [Impact-focused bullet point]

EDUCATION
[Your Degree] | [Institution Name] | [Year]
${skillsKeywords.length > 0 ? `\nTECHNICAL SKILLS\n${skillsKeywords.slice(0, 10).map(s => `• ${s}`).join('\n')}` : ''}

---
Note: This resume template was generated from the job description. Please replace all placeholders with your actual information, experience, and achievements.`;
    }

    return NextResponse.json({ ok: true, tailored });
  } catch (err: any) {
    console.error("tailor-resume error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
