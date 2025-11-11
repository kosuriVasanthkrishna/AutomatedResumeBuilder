import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Verify file is actually a File object
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Invalid file object' },
        { status: 400 }
      )
    }

    console.log('Received file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    })

    const arrayBuffer = await file.arrayBuffer()
    // Create a proper Node.js Buffer from the arrayBuffer
    const buffer = Buffer.from(arrayBuffer)
    let text = ''
    
    // Verify we have valid data
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: 'The uploaded file appears to be empty' },
        { status: 400 }
      )
    }
    
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: 'Failed to convert file to buffer' },
        { status: 500 }
      )
    }

    // Get file extension as fallback for file type detection
    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'))

    // Check by MIME type first, then by file extension
    const isPDF = file.type === 'application/pdf' || fileExtension === '.pdf'
    const isDOCX = 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileExtension === '.docx'
    const isDOC = 
      file.type === 'application/msword' ||
      fileExtension === '.doc'
    const isTXT = file.type === 'text/plain' || fileExtension === '.txt'

    if (isPDF) {
      try {
        const data = await pdfParse(buffer)
        text = data.text
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to parse PDF file' },
          { status: 500 }
        )
      }
    } else if (isDOCX) {
      try {
        console.log('Attempting to parse DOCX file:', file.name, 'Size:', file.size, 'Type:', file.type)
        console.log('Buffer length:', buffer.length, 'ArrayBuffer byteLength:', arrayBuffer.byteLength)
        
        // Mammoth works with buffer in Node.js environment
        // The buffer must be a proper Node.js Buffer instance
        const result = await mammoth.extractRawText({ 
          buffer: buffer 
        })
        
        text = result.value
        
        if (result.messages && result.messages.length > 0) {
          console.warn('Mammoth warnings:', result.messages)
        }
        
        if (!text || text.trim().length === 0) {
          console.error('DOCX file parsed but resulted in empty text')
          return NextResponse.json(
            { error: 'The DOCX file appears to be empty or could not be read. Please ensure the file is not corrupted or password-protected.' },
            { status: 500 }
          )
        }
        console.log('Successfully parsed DOCX, extracted', text.length, 'characters')
      } catch (error) {
        console.error('DOCX parsing error details:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          arrayBufferSize: arrayBuffer.byteLength,
          bufferSize: buffer.length
        })
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
          { error: `Failed to parse DOCX file: ${errorMessage}. Please try uploading as PDF or ensure the file is not corrupted or password-protected.` },
          { status: 500 }
        )
      }
    } else if (isDOC) {
      // Note: Old .doc files are binary format and mammoth doesn't support them
      // We'll try to extract text, but .doc files may not work perfectly
      // For best results, users should convert .doc to .docx or PDF
      try {
        // Try to extract text from .doc - this is a workaround
        // Note: This may not work for all .doc files as they're in binary format
        const result = await mammoth.extractRawText({ arrayBuffer })
        text = result.value
      } catch (error) {
        return NextResponse.json(
          { error: 'Old .doc format is not fully supported. Please convert your file to .docx or PDF format for best results.' },
          { status: 500 }
        )
      }
    } else if (isTXT) {
      text = buffer.toString('utf-8')
    } else {
      return NextResponse.json(
        { error: `Unsupported file type. Supported formats: PDF, DOC, DOCX, TXT. Detected: ${file.type || fileExtension}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      content: text,
      fileName: file.name,
      fileType: file.type,
    })
  } catch (error) {
    console.error('Error parsing file:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An error occurred while parsing the file',
      },
      { status: 500 }
    )
  }
}

