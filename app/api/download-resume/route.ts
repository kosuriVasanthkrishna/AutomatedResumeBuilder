import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import PDFDocument from 'pdfkit'

export async function POST(request: NextRequest) {
  try {
    const { content, format } = await request.json()

    if (!content || !format) {
      return NextResponse.json(
        { error: 'Content and format are required' },
        { status: 400 }
      )
    }

    if (format === 'docx') {
      // Create DOCX document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: parseTextToDocx(content),
          },
        ],
      })

      const buffer = await Packer.toBuffer(doc)
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="resume.docx"',
        },
      })
    } else if (format === 'pdf') {
      // Create PDF document with professional ATS-style borders
      const doc = new PDFDocument({
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        size: 'LETTER',
      })

      const pageWidth = doc.page.width
      const pageHeight = doc.page.height
      const margin = 40
      const borderWidth = 2
      
      // Draw outer border (professional frame)
      doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)
        .lineWidth(borderWidth)
        .stroke()

      // Add top header divider line (thick, like professional ATS resumes)
      doc.moveTo(margin, margin + 35)
        .lineTo(pageWidth - margin, margin + 35)
        .lineWidth(2)
        .stroke()
      
      // Add subtle inner border lines for professional look
      doc.moveTo(margin + 5, margin + 5)
        .lineTo(pageWidth - margin - 5, margin + 5)
        .lineWidth(0.5)
        .strokeColor('#e0e0e0')
        .stroke()
        .strokeColor('black')

      // Parse text and add to PDF with proper formatting
      const lines = content.split('\n')
      let yPosition = margin + 55
      let lastWasHeading = false
      
      lines.forEach((line: string, index: number) => {
        const trimmed = line.trim()
        
        // Check if we need a new page
        if (yPosition > pageHeight - margin - 40) {
          doc.addPage()
          // Add border and divider on new page
          doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)
            .lineWidth(borderWidth)
            .stroke()
          doc.moveTo(margin, margin + 35)
            .lineTo(pageWidth - margin, margin + 35)
            .lineWidth(2)
            .stroke()
          yPosition = margin + 55
          lastWasHeading = false
        }
        
        // Skip empty lines after headings
        if (trimmed === '') {
          if (!lastWasHeading) {
            yPosition += 8
          }
          return
        }
        
        // Detect section headings (all caps, short lines)
        if (trimmed.match(/^[A-Z][A-Z\s]+$/) && trimmed.length < 60 && trimmed.length > 2) {
          // Add section divider line before heading (professional ATS style)
          if (yPosition > margin + 55) {
            doc.moveTo(margin + 15, yPosition - 8)
              .lineTo(pageWidth - margin - 15, yPosition - 8)
              .lineWidth(1)
              .strokeColor('#d0d0d0')
              .stroke()
              .strokeColor('black')
            yPosition += 5
          }
          
          // Bold heading
          doc.fontSize(13)
            .text(trimmed, margin + 15, yPosition, {
              align: 'left',
              width: pageWidth - 2 * margin - 30,
            })
          yPosition += 22
          lastWasHeading = true
        } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          // Bullet point
          doc.fontSize(10.5)
            .text(trimmed, margin + 25, yPosition, {
              align: 'left',
              width: pageWidth - 2 * margin - 40,
            })
          yPosition += 14
          lastWasHeading = false
        } else if (trimmed.match(/^[─═━┅┉┈┄┄┄]+$/)) {
          // Horizontal line/divider - draw it
          doc.moveTo(margin + 15, yPosition)
            .lineTo(pageWidth - margin - 15, yPosition)
            .lineWidth(1)
            .stroke()
          yPosition += 12
          lastWasHeading = false
        } else {
          // Regular text
          doc.fontSize(10.5)
            .text(trimmed, margin + 15, yPosition, {
              align: 'left',
              width: pageWidth - 2 * margin - 30,
            })
          yPosition += 16
          lastWasHeading = false
        }
      })

      // Convert PDF to buffer
      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          resolve(Buffer.concat(chunks))
        })
        doc.on('error', reject)
        doc.end()
      })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="resume.pdf"',
        },
      })
    } else if (format === 'txt') {
      // Plain text
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="resume.txt"',
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Supported: docx, pdf, txt' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error generating file:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate file',
      },
      { status: 500 }
    )
  }
}

function parseTextToDocx(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const lines = text.split('\n')

  lines.forEach((line) => {
    const trimmed = line.trim()
    
    if (trimmed === '') {
      paragraphs.push(new Paragraph({ text: '' }))
    } else if (trimmed.match(/^[A-Z][A-Z\s]+$/) && trimmed.length < 50) {
      // Likely a heading (all caps, short)
      paragraphs.push(
        new Paragraph({
          text: trimmed,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      )
    } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      // Bullet point
      paragraphs.push(
        new Paragraph({
          text: trimmed.substring(1).trim(),
          bullet: { level: 0 },
          spacing: { after: 100 },
        })
      )
    } else {
      // Regular paragraph
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: 22, // 11pt
            }),
          ],
          spacing: { after: 100 },
        })
      )
    }
  })

  return paragraphs
}

