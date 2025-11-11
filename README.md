# Automated Resume Builder

An AI-powered web application that automatically tailors your resume to match any job description in seconds. Upload your resume once, and the system saves it for future use - you only need to provide the job description for subsequent tailoring.

## Features

- 📄 **Resume Upload**: Support for PDF, DOC, DOCX, and TXT files
- 💾 **Auto-Save**: Your resume is automatically saved in browser storage
- 🤖 **AI-Powered Tailoring**: Uses Groq's free Llama 3.1 model to intelligently match your resume to job descriptions
- ⚡ **Fast Processing**: Get tailored resumes in seconds
- 👀 **Side-by-Side Preview**: Compare original and tailored versions
- 📥 **Download**: Export your tailored resume as a text file
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 (React) with TypeScript
- **Styling**: Tailwind CSS
- **AI**: Groq API (Free tier - Llama 3.1 70B)
- **File Processing**: Mammoth (for DOCX), PDF.js (for PDF)
- **Storage**: Browser localStorage

## Prerequisites

- Node.js 18+ and npm
- Groq API key (Free - [Get one here](https://console.groq.com/))

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

   **Get your free Groq API key:**
   - Visit [https://console.groq.com/](https://console.groq.com/)
   - Sign up for free (no credit card required)
   - Create an API key
   - Copy it to your `.env.local` file

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **First Time**:
   - Upload your resume (PDF, DOC, DOCX, or TXT)
   - The resume will be automatically saved in your browser

2. **Tailor Your Resume**:
   - Paste the job description in the text area
   - Click "✨ Tailor Resume to JD"
   - Wait a few seconds for AI processing
   - View the tailored resume in the preview panel

3. **Subsequent Uses**:
   - Your saved resume will be loaded automatically
   - Just paste the new job description and click "Tailor Resume to JD"

4. **Download**:
   - Click the "Download" button to save your tailored resume

## Project Structure

```
├── app/
│   ├── api/
│   │   └── tailor-resume/
│   │       └── route.ts          # API endpoint for resume tailoring
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page
├── components/
│   ├── JDInput.tsx               # Job description input component
│   ├── ResumePreview.tsx         # Resume preview component
│   └── ResumeUpload.tsx          # Resume upload component
├── types/
│   └── resume.ts                 # TypeScript types
└── package.json
```

## Environment Variables

- `GROQ_API_KEY`: Your Groq API key (required, free at https://console.groq.com/)
- `OPENAI_API_KEY`: (Optional) Fallback if GROQ_API_KEY is not set

### For Local Development
Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### For Vercel Deployment
1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add a new environment variable:
   - **Name**: `GROQ_API_KEY`
   - **Value**: Your Groq API key
   - **Environment**: Production, Preview, and Development (select all)
4. Redeploy your application

**Important**: Never commit your `.env.local` file to Git. It's already in `.gitignore`.

## Notes

- The resume is stored in browser localStorage, so it persists across sessions
- For production, consider implementing server-side storage and user authentication
- **Groq is completely FREE** - No credit card required, generous rate limits, and fast inference
- The current implementation uses Llama 3.3 70B Versatile (free). You can modify the model in `app/api/tailor-resume/route.ts`
- Alternative free models available: `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `llama-3.3-70b-versatile`
- PDF parsing uses server-side parsing for better reliability

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

