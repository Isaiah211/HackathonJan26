/**
 * PDF Export Service
 * Generates PDF reports of business impact analysis
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Cache logo data URL to avoid repeated fetches
let cachedLogoDataUrl = null;

const loadLogoDataUrl = async () => {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const response = await fetch('/favicon.svg');
    const svgText = await response.text();
    const encoded = btoa(unescape(encodeURIComponent(svgText)));
    cachedLogoDataUrl = `data:image/svg+xml;base64,${encoded}`;
    return cachedLogoDataUrl;
  } catch (error) {
    console.warn('Logo load failed, continuing without logo:', error);
    return null;
  }
};

/**
 * Generate PDF from scenario data
 * @param {object} scenario - Scenario with businesses and predictions
 * @returns {Promise} - PDF generation promise
 */
export const generatePDF = async (scenario) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrap
    const addText = (text, fontSize = 10, isBold = false) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      
      lines.forEach(line => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
      
      yPosition += 3;
    };

    // Add header
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    const headerLogoDataUrl = await loadLogoDataUrl();
    if (headerLogoDataUrl) {
      // Draw logo on the left of header
      pdf.addImage(headerLogoDataUrl, 'SVG', margin, 7, 12, 12);
    }
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ImpactLens', margin + 16, 15);
    
    pdf.setFontSize(10);
    pdf.text('Business Impact Analysis Report', margin + 16, 21);
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    yPosition = 35;

    // Add scenario title and date
    addText(`Scenario: ${scenario.name || 'Unnamed Scenario'}`, 16, true);
    addText(`Generated: ${new Date().toLocaleString()}`, 9);
    yPosition += 5;

    // Add businesses
    scenario.businesses.forEach((business, index) => {
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      // Business header
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
      
      addText(`${index + 1}. ${business.name}`, 14, true);
      addText(`Category: ${business.category?.label || 'Unknown'} | Employees: ${business.employees}`, 10);
      
      if (business.location) {
        addText(`Location: ${business.location.address || `${business.location.lat.toFixed(4)}, ${business.location.lng.toFixed(4)}`}`, 9);
      }
      
      yPosition += 3;

      // Predictions
      if (business.predictions) {
        const pred = business.predictions;
        
        addText('Impact Predictions:', 11, true);
        
        addText(`• Jobs Created: ${pred.jobs.total} (${pred.jobs.direct} direct + ${pred.jobs.indirect} indirect)`, 10);
        addText(`• Annual Revenue: $${pred.revenue.toLocaleString()}k`, 10);
        addText(`• Foot Traffic Increase: ${pred.footTraffic}%`, 10);
        addText(`• Tax Revenue: $${pred.taxRevenue.total}k/year`, 10);
        addText(`• Local Spending Impact: $${pred.localSpending}k/year`, 10);
        
        yPosition += 3;
        
        // Add explanation if available
        if (business.explanation) {
          addText('Analysis:', 11, true);
          addText(business.explanation, 9);
        }
      }
      
      yPosition += 8;
    });

    // Add footer
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i} of ${totalPages} | ImpactLens | impactlens.app`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const filename = `ImpactLens_${scenario.name?.replace(/[^a-z0-9]/gi, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('PDF generation failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate PDF with chart images
 * @param {HTMLElement} element - DOM element to capture
 * @param {object} scenario - Scenario data
 * @returns {Promise} - PDF generation promise
 */
export const generatePDFWithCharts = async (element, scenario) => {
  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add header
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 0, pageWidth, 25, 'F');

    const chartHeaderLogoDataUrl = await loadLogoDataUrl();
    if (chartHeaderLogoDataUrl) {
      pdf.addImage(chartHeaderLogoDataUrl, 'SVG', 10, 7, 12, 12);
    }
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ImpactLens', 26, 15);
    
    pdf.setFontSize(10);
    pdf.text('Business Impact Analysis Report', 26, 21);

    // Add captured image
    let position = 35;
    
    if (imgHeight > pageHeight - 50) {
      // Split across pages if needed
      let remainingHeight = imgHeight;
      let currentY = 0;
      
      while (remainingHeight > 0) {
        const sliceHeight = Math.min(pageHeight - 40, remainingHeight);
        
        pdf.addImage(
          imgData,
          'PNG',
          10,
          position,
          imgWidth,
          sliceHeight,
          undefined,
          'FAST',
          0
        );
        
        remainingHeight -= sliceHeight;
        currentY += sliceHeight;
        
        if (remainingHeight > 0) {
          pdf.addPage();
          position = 10;
        }
      }
    } else {
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    }

    const filename = `ImpactLens_Visual_${scenario.name?.replace(/[^a-z0-9]/gi, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('PDF with charts generation failed:', error);
    return { success: false, error: error.message };
  }
};

export default {
  generatePDF,
  generatePDFWithCharts
};
