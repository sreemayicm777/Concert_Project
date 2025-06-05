class ConcertTicketPDF {
  constructor() {
    this.bookingData = null;
    this.concertData = null;
    this.initialize();
  }

  async initialize() {
    await this.loadLibraries();
    await this.loadConcertData();
    this.setupEventListeners();
  }

  async loadLibraries() {
    // Ensure jsPDF is loaded
    if (typeof window.jspdf === 'undefined') {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    
    // Ensure QRCode is loaded
    if (typeof QRCode === 'undefined') {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js');
    }
  }

  loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async loadConcertData() {
    try {
      // Extract concert data from page elements or use defaults
      this.concertData = {
        id: document.querySelector('[name="concertId"]')?.value || 'default',
        name: document.querySelector('.card-title')?.textContent?.trim() || 'Concert',
        date: document.querySelector('.meta-item:nth-child(1) p')?.textContent || new Date().toLocaleDateString(),
        time: document.querySelector('.meta-item:nth-child(2) p')?.textContent || '20:00',
        venue: document.querySelector('.meta-item:nth-child(3) p')?.textContent || 'Venue',
        price: parseFloat("<%= concert.ticketPrice %>") || 0,
        image: document.querySelector('.concert-main-image')?.src || ''
      };
    } catch (error) {
      console.error('Error loading concert data:', error);
      this.concertData = this.getDefaultConcertData();
    }
  }

  getDefaultConcertData() {
    return {
      id: 'default',
      name: 'Concert',
      date: new Date().toLocaleDateString(),
      time: '20:00',
      venue: 'Venue',
      price: 0,
      image: ''
    };
  }

  showDownloadButton() {
    const btn = document.getElementById('downloadPdfBtn');
    if (btn) {
      btn.style.display = 'block';
      btn.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async generateTicketPDF(bookingData = null) {
    if (bookingData) {
      this.bookingData = bookingData;
    }

    if (!this.bookingData || !this.concertData) {
      this.showError('Booking data not available');
      return false;
    }

    try {
      // Show loading state
      const btn = document.getElementById('downloadPdfBtn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...';
      }

      // Try server-side generation first
      try {
        const serverPDF = await this.generateServerPDF();
        if (serverPDF) {
          this.downloadPDF(serverPDF);
          return true;
        }
      } catch (serverError) {
        console.log('Server PDF failed, using client fallback:', serverError);
      }

      // Fallback to client-side generation
      const clientPDF = await this.generateClientPDF();
      this.downloadPDF(clientPDF);
      return true;
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      this.showError('Failed to generate ticket. Please try again.');
      return false;
    } finally {
      const btn = document.getElementById('downloadPdfBtn');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-download me-2"></i> Download Ticket';
      }
    }
  }

  async generateServerPDF() {
    const response = await fetch('/api/generate-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        booking: this.bookingData,
        concert: this.concertData
      })
    });

    if (!response.ok) throw new Error('Server error');
    return await response.blob();
  }

  async generateClientPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150] // Ticket size
    });

    // Add ticket content
    this.createTicketHeader(doc);
    this.createEventDetails(doc);
    this.createBookingDetails(doc);
    await this.createQRCode(doc);
    this.createFooter(doc);

    return doc;
  }

  createTicketHeader(doc) {
    doc.setFillColor(30, 58, 138); // Dark blue
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCERTHUB TICKET', doc.internal.pageSize.getWidth() / 2, 10, { align: 'center' });
  }

  createEventDetails(doc) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(this.concertData.name, 10, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${this.concertData.date}`, 10, 35);
    doc.text(`Time: ${this.concertData.time}`, 10, 40);
    doc.text(`Venue: ${this.concertData.venue}`, 10, 45);
  }

  createBookingDetails(doc) {
    doc.setFontSize(10);
    doc.text(`Ticket Holder: ${this.bookingData.username}`, 10, 60);
    doc.text(`Tickets: ${this.bookingData.ticketCount}`, 10, 65);
    doc.text(`Total: $${parseFloat(this.bookingData.totalPrice).toFixed(2)}`, 10, 70);
    doc.text(`Booking ID: ${this.bookingData._id || this.bookingData.id || 'N/A'}`, 10, 75);
  }

async createQRCode(doc) {
  try {
    // QR code URL
    const qrCodeUrl = 'https://hexdocs.pm/qr_code/docs/qrcode.svg';
    
    // 1. Fetch the SVG QR code
    const response = await fetch(qrCodeUrl);
    if (!response.ok) throw new Error('Failed to fetch QR code');
    const svgText = await response.text();
    
    // 2. Convert SVG to canvas
    const canvas = document.createElement('canvas');
    const size = 200; // QR code size in pixels
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Create an image from the SVG
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
    
    // Wait for image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    // Draw the image on canvas
    ctx.drawImage(img, 0, 0, size, size);
    
    // 3. Convert canvas to image data URL
    const qrImageData = canvas.toDataURL('image/png');

    // 4. Add QR code to PDF (position and size in mm)
    const qrWidth = 30; // 30mm width
    const qrHeight = 30; // 30mm height
    const pageWidth = doc.internal.pageSize.getWidth();
    const x = (pageWidth - qrWidth) / 2; // Center horizontally
    const y = 80; // Vertical position
    
    doc.addImage(
      qrImageData,
      'PNG',
      x,
      y,
      qrWidth,
      qrHeight
    );

    // 5. Add QR code label
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(
      'Scan to verify ticket',
      pageWidth / 2,
      y + qrHeight + 5,
      { align: 'center' }
    );

    // 6. Add white background for better contrast
    doc.setFillColor(255, 255, 255);
    doc.rect(x - 2, y - 2, qrWidth + 4, qrHeight + 4, 'F');
    // Redraw QR code on top
    doc.addImage(
      qrImageData,
      'PNG',
      x,
      y,
      qrWidth,
      qrHeight
    );

  } catch (error) {
    console.error('QR code generation failed:', error);
    // Fallback: Show booking ID
    doc.setFontSize(10);
    doc.text(
      `Booking ID: ${this.bookingData._id || this.bookingData.id}`,
      10,
      90
    );
  }
}

  createFooter(doc) {
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text('• Non-transferable • Non-refundable • Right of admission reserved', 
            50, 130, { align: 'center' });
    doc.text('• Please arrive 30 minutes before showtime', 50, 133, { align: 'center' });
    doc.text('• Problems? contact support@concerthub.com', 50, 136, { align: 'center' });
  }

  downloadPDF(pdfDoc) {
    const filename = `ConcertTicket_${this.bookingData._id || Date.now()}.pdf`;
    
    if (pdfDoc instanceof Blob) {
      // Handle server-generated PDF (Blob)
      const url = URL.createObjectURL(pdfDoc);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (typeof pdfDoc.save === 'function') {
      // Handle client-generated PDF (jsPDF instance)
      pdfDoc.save(filename);
    } else {
      throw new Error('Unsupported PDF format');
    }
    
    this.showSuccess('Ticket downloaded successfully!');
  }

  showError(message) {
    const element = document.getElementById('error-message');
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
      setTimeout(() => element.style.display = 'none', 5000);
    } else {
      alert(message);
    }
  }

  showSuccess(message) {
    const element = document.getElementById('success-message');
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
      setTimeout(() => element.style.display = 'none', 5000);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.concertTicketPDF = new ConcertTicketPDF();
});
