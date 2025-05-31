// Enhanced PDF Ticket Generator
class ConcertTicketPDF {
  constructor() {
    this.ticketConfig = {
      orientation: 'landscape',
      unit: 'mm',
      format: [100, 150]
    };
  }

  async generateTicket(bookingData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(this.ticketConfig);
    
    // Header
    this.createHeader(doc, bookingData);
    
    // Event Details
    this.createEventDetails(doc, bookingData);
    
    // Booking Information
    this.createBookingInfo(doc, bookingData);
    
    // QR Code
    await this.createQRCode(doc, bookingData._id);
    
    // Footer
    this.createFooter(doc);
    
    // Save PDF
    doc.save(`Ticket_${bookingData._id}.pdf`);
  }

  createHeader(doc, booking) {
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(booking.concert.name, doc.internal.pageSize.getWidth()/2, 12, { align: 'center' });
  }

  createEventDetails(doc, booking) {
    const event = booking.concert;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Date
    doc.text('🗓️ Date:', 15, 35);
    doc.text(event.date ? new Date(event.date).toLocaleDateString() : 'Not available', 30, 35);
    
    // Time
    doc.text('🕒 Time:', 15, 40);
    doc.text(event.time || 'Not available', 30, 40);
    
    // Venue
    doc.text('📍 Venue:', 15, 45);
    doc.text(event.venue || 'Not available', 30, 45);
    
    // Artist
    doc.text('🎤 Artist:', 15, 50);
    doc.text(event.artist || 'Not available', 30, 50);
  }

  createBookingInfo(doc, booking) {
    doc.setFontSize(10);
    
    // Tickets
    doc.text('🎫 Tickets:', 15, 65);
    doc.text(booking.ticketCount.toString(), 30, 65);
    
    // Total Price
    doc.text('💵 Total:', 15, 70);
    doc.text(`$${booking.totalPrice.toFixed(2)}`, 30, 70);
    
    // Payment Method
    doc.text('💳 Payment:', 15, 75);
    doc.text(this.formatPaymentMethod(booking.paymentMethod), 30, 75);
    
    // Status
    doc.text('📌 Status:', 15, 80);
    doc.text(booking.status.charAt(0).toUpperCase() + booking.status.slice(1), 30, 80);
  }

  async createQRCode(doc, bookingId) {
    try {
      const qr = new QRCode(0, 'L');
      qr.addData(`CONCERTHUB|${bookingId}`);
      qr.make();
      
      const size = 30;
      const x = 110;
      const y = 40;
      
      const cellSize = size / qr.getModuleCount();
      doc.setFillColor(0, 0, 0);
      
      for (let row = 0; row < qr.getModuleCount(); row++) {
        for (let col = 0; col < qr.getModuleCount(); col++) {
          if (qr.isDark(row, col)) {
            doc.rect(x + col * cellSize, y + row * cellSize, cellSize, cellSize, 'F');
          }
        }
      }
      
      doc.setFontSize(8);
      doc.text('Scan for entry', x + size/2, y + size + 5, { align: 'center' });
    } catch (error) {
      console.error('QR code error:', error);
      doc.setFontSize(10);
      doc.text(`Booking ID: ${bookingId}`, 110, 50);
    }
  }

  createFooter(doc) {
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text('• Non-transferable • Non-refundable • Right of admission reserved', 
            75, 135, { align: 'center' });
  }

  formatPaymentMethod(method) {
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Initialize PDF generator
document.addEventListener('DOMContentLoaded', () => {
  window.concertTicketPDF = new ConcertTicketPDF();
});