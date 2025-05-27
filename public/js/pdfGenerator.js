// pdfGenerator.js - Fixed with proper error handling
class TicketPDFGenerator {
    constructor() {
        this.bookingData = null;
        this.concertData = null;
        this.init();
    }

    init() {
        // Get concert data from the hidden script tag or fetch from API
        this.loadConcertData();

        // Listen for successful booking to enable PDF download
        document.addEventListener('bookingSuccess', (event) => {
            this.bookingData = event.detail;
            this.showDownloadButton();
        });

        // Add event listener for PDF download button
        const downloadBtn = document.getElementById('downloadPdfBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.generatePDF();
            });
        }
    }

    async loadConcertData() {
        // Try to get from hidden script tag first
        const concertDataElement = document.getElementById('concertData');
        if (concertDataElement) {
            try {
                this.concertData = JSON.parse(concertDataElement.textContent);
                return;
            } catch (error) {
                console.error('Error parsing concert data from script tag:', error);
            }
        }

        // If not available, fetch from API
        const concertId = this.getConcertIdFromUrl() || document.querySelector('[name="concertId"]')?.value;
        if (concertId) {
            await this.fetchConcertData(concertId);
        }
    }

    async fetchConcertData(concertId) {
        try {
            const response = await fetch(`/api/concerts/${concertId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Expected JSON but received:', text.substring(0, 200));
                throw new Error('Server did not return JSON response');
            }

            const result = await response.json();
            this.concertData = result.data || result;
        } catch (error) {
            console.error('Error fetching concert data:', error);
            // Fallback: try to get data from the page elements
            this.extractConcertDataFromPage();
        }
    }

    extractConcertDataFromPage() {
        // Extract concert data from the visible page elements as fallback
        try {
            this.concertData = {
                id: this.getConcertIdFromUrl() || 'unknown',
                name: document.querySelector('h1')?.textContent || 'Unknown Concert',
                artist: document.querySelector('.artist')?.textContent || '',
                date: document.querySelector('[data-date]')?.textContent || 
                      document.querySelector('.date')?.textContent || 
                      new Date().toISOString().split('T')[0],
                time: document.querySelector('[data-time]')?.textContent || 
                      document.querySelector('.time')?.textContent || '20:00',
                venue: document.querySelector('[data-venue]')?.textContent || 
                       document.querySelector('.venue')?.textContent || 'Unknown Venue',
                city: document.querySelector('[data-city]')?.textContent || 
                      document.querySelector('.city')?.textContent || '',
                country: document.querySelector('[data-country]')?.textContent || 
                         document.querySelector('.country')?.textContent || '',
                price: parseFloat(document.querySelector('[data-price]')?.textContent || 
                                 document.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || '100'),
                image: document.querySelector('img')?.src || ''
            };
            console.log('Extracted concert data from page:', this.concertData);
        } catch (error) {
            console.error('Error extracting concert data from page:', error);
            // Absolute fallback
            this.concertData = {
                id: 'fallback',
                name: 'Concert Event',
                date: new Date().toISOString().split('T')[0],
                time: '20:00',
                venue: 'Concert Venue',
                price: 100
            };
        }
    }

    getConcertIdFromUrl() {
        const urlParts = window.location.pathname.split('/');
        return urlParts[urlParts.length - 1];
    }

    showDownloadButton() {
        const downloadBtn = document.getElementById('downloadPdfBtn');
        if (downloadBtn) {
            downloadBtn.style.display = 'block';
            downloadBtn.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async generatePDF() {
        if (!this.bookingData || !this.concertData) {
            alert('Booking data not available. Please complete your booking first.');
            return;
        }

        try {
            // Try server-side PDF generation first
            const pdfData = await this.sendBookingDataToServer();
            
            if (pdfData && pdfData.pdf_url) {
                this.downloadPDFFromServer(pdfData.pdf_url);
            } else {
                // Fallback to client-side PDF generation
                await this.generateClientSidePDF();
            }

        } catch (error) {
            console.error('Server PDF generation failed, using client-side fallback:', error);
            // Fallback to client-side generation
            await this.generateClientSidePDF();
        }
    }

    async sendBookingDataToServer() {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                             document.querySelector('input[name="_token"]')?.value || '';

            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({
                    booking_id: this.bookingData.bookingId,
                    concert_id: this.concertData.id,
                    booking_data: this.bookingData,
                    concert_data: this.concertData,
                    pdf_type: 'ticket',
                    format: 'A4'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Expected JSON but received:', text.substring(0, 200));
                throw new Error('Server did not return JSON response for PDF generation');
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending data to server:', error);
            throw error;
        }
    }

    downloadPDFFromServer(pdfUrl) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${this.concertData.name.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket_${this.bookingData.bookingId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showSuccessMessage('PDF ticket downloaded successfully!');
    }

    async generateClientSidePDF() {
        try {
            // Check if jsPDF is available
            if (!window.jspdf) {
                throw new Error('jsPDF library not loaded');
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('portrait', 'mm', 'a4');
            
            // Set up colors
            const primaryColor = [220, 53, 69]; // Bootstrap danger color
            const secondaryColor = [108, 117, 125]; // Bootstrap secondary
            const backgroundGradient = [248, 249, 250]; // Light background

            // Add background
            doc.setFillColor(...backgroundGradient);
            doc.rect(0, 0, 210, 297, 'F');

            // Header section with gradient effect
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 40, 'F');
            
            // Add header pattern (diagonal lines for texture)
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(0.3);
            for (let i = 0; i < 210; i += 8) {
                doc.line(i, 0, i + 20, 40);
            }

            // Concert Hub Logo/Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.text('🎵 CONCERTHUB', 15, 18);
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text('Your Premium Concert Experience', 15, 28);

            // Booking confirmation badge
            doc.setFillColor(40, 167, 69); // Success green
            doc.roundedRect(150, 8, 45, 12, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('CONFIRMED', 158, 16);

            // Main ticket section
            const ticketY = 50;
            
            // Ticket background with border
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(1);
            doc.roundedRect(10, ticketY, 190, 120, 3, 3, 'FD');

            // Concert image placeholder (if available)
            try {
                if (this.concertData.image) {
                    const imageData = await this.getImageAsBase64(this.concertData.image);
                    if (imageData) {
                        doc.addImage(imageData, 'JPEG', 15, ticketY + 10, 60, 40);
                    }
                }
            } catch (error) {
                console.log('Could not load concert image, using placeholder');
            }

            // If no image was added, draw placeholder
            if (!this.concertData.image) {
                doc.setFillColor(240, 240, 240);
                doc.rect(15, ticketY + 10, 60, 40, 'F');
                doc.setTextColor(...secondaryColor);
                doc.setFontSize(8);
                doc.text('Concert Image', 30, ticketY + 32);
            }

            // Concert details
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text(this.concertData.name || 'Concert Event', 85, ticketY + 20);

            if (this.concertData.artist) {
                doc.setFontSize(12);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(...secondaryColor);
                doc.text(`by ${this.concertData.artist}`, 85, ticketY + 30);
            }

            // Event details in a structured format
            const detailsY = ticketY + 45;
            const leftColX = 15;
            const rightColX = 110;

            // Date and Time
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('📅 DATE & TIME', leftColX, detailsY);
            
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            const eventDate = new Date(this.concertData.date);
            doc.text(eventDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            }), leftColX, detailsY + 8);
            doc.text(this.concertData.time || '20:00', leftColX, detailsY + 16);

            // Venue
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('📍 VENUE', rightColX, detailsY);
            
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(this.concertData.venue || 'Concert Venue', rightColX, detailsY + 8);
            if (this.concertData.city) {
                doc.text(`${this.concertData.city}${this.concertData.country ? ', ' + this.concertData.country : ''}`, rightColX, detailsY + 16);
            }

            // Ticket information section
            const ticketInfoY = ticketY + 80;
            
            // Separator line
            doc.setDrawColor(...secondaryColor);
            doc.setLineWidth(0.5);
            doc.line(15, ticketInfoY - 5, 195, ticketInfoY - 5);

            // Ticket details
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('🎫 TICKET DETAILS', leftColX, ticketInfoY);

            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(`Tickets: ${this.bookingData.ticketCount || 1}`, leftColX, ticketInfoY + 10);
            doc.text(`Price per ticket: $${(this.concertData.price || 100).toFixed(2)}`, leftColX, ticketInfoY + 18);
            doc.text(`Total Amount: $${(this.bookingData.totalAmount || this.concertData.price || 100).toFixed(2)}`, leftColX, ticketInfoY + 26);
            doc.text(`Payment Method: ${(this.bookingData.paymentMethod || 'paypal').replace('_', ' ').toUpperCase()}`, leftColX, ticketInfoY + 34);

            // Customer Information
            if (this.bookingData.customerInfo && this.bookingData.customerInfo.name) {
                doc.text(`Customer: ${this.bookingData.customerInfo.name}`, leftColX, ticketInfoY + 42);
            }

            // Booking ID
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('BOOKING ID', rightColX, ticketInfoY);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(this.bookingData.bookingId || 'N/A', rightColX, ticketInfoY + 10);

            // QR Code section
            const qrY = 185;
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...primaryColor);
            doc.roundedRect(10, qrY, 190, 70, 3, 3, 'FD');

            // QR Code title
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('🔲 SCAN FOR ENTRY', 15, qrY + 15);

            // Generate QR code
            try {
                const qrCodeData = this.generateQRCodeData();
                const qrCodeDataURL = await this.generateQRCode(qrCodeData);
                
                if (qrCodeDataURL) {
                    doc.addImage(qrCodeDataURL, 'PNG', 15, qrY + 20, 40, 40);
                }
            } catch (error) {
                console.error('Error generating QR code:', error);
            }

            // QR Code information
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...secondaryColor);
            const qrText = [
                '• Present this QR code at the venue for entry',
                '• Ensure your phone screen is bright and clean',
                '• Arrive 30 minutes before the show starts',
                '• This ticket is non-transferable and non-refundable',
                '• Keep this PDF safe - it\'s your entry pass!'
            ];
            
            qrText.forEach((text, index) => {
                doc.text(text, 65, qrY + 25 + (index * 6));
            });

            // Footer
            const footerY = 270;
            doc.setFillColor(...primaryColor);
            doc.rect(0, footerY, 210, 27, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text('Thank you for choosing ConcertHub! Follow us @ConcertHub for updates', 15, footerY + 8);
            doc.text(`Generated on ${new Date().toLocaleString()}`, 15, footerY + 16);
            doc.text('Support: support@concerthub.com | www.concerthub.com', 15, footerY + 24);

            // Save the PDF
            const fileName = `${(this.concertData.name || 'Concert').replace(/[^a-zA-Z0-9]/g, '_')}_Ticket_${this.bookingData.bookingId || 'unknown'}.pdf`;
            doc.save(fileName);

            // Log PDF generation to server (optional, will fail gracefully)
            this.logPDFGeneration().catch(error => {
                console.log('Could not log PDF generation to server:', error);
            });

            // Show success message
            this.showSuccessMessage('PDF ticket downloaded successfully!');

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please ensure all required libraries are loaded and try again.');
        }
    }

    async logPDFGeneration() {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                             document.querySelector('input[name="_token"]')?.value || '';

            const response = await fetch('/api/log-pdf-generation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({
                    booking_id: this.bookingData.bookingId,
                    concert_id: this.concertData.id,
                    generation_method: 'client-side',
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                await response.json();
            }
        } catch (error) {
            console.error('Error logging PDF generation:', error);
            throw error;
        }
    }

    generateQRCodeData() {
        return JSON.stringify({
            bookingId: this.bookingData.bookingId || 'unknown',
            concertId: this.concertData.id || 'unknown',
            concertName: this.concertData.name || 'Concert Event',
            venue: this.concertData.venue || 'Unknown Venue',
            date: this.concertData.date || new Date().toISOString().split('T')[0],
            time: this.concertData.time || '20:00',
            tickets: this.bookingData.ticketCount || 1,
            totalAmount: this.bookingData.totalAmount || this.concertData.price || 100,
            customerName: this.bookingData.customerInfo?.name || '',
            timestamp: new Date().toISOString(),
            verificationHash: this.generateVerificationHash()
        });
    }

    generateVerificationHash() {
        const data = `${this.bookingData.bookingId || 'unknown'}-${this.concertData.id || 'unknown'}-${this.bookingData.totalAmount || 100}`;
        return btoa(data).substring(0, 16);
    }

    async generateQRCode(data) {
        return new Promise((resolve) => {
            try {
                // Check if qrcode library is available
                if (typeof qrcode === 'undefined') {
                    console.error('QR code library not available');
                    resolve(null);
                    return;
                }

                const qr = qrcode(0, 'M');
                qr.addData(data);
                qr.make();
                
                // Create canvas element
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const moduleCount = qr.getModuleCount();
                const cellSize = 4;
                const margin = cellSize * 2;
                
                canvas.width = moduleCount * cellSize + margin * 2;
                canvas.height = moduleCount * cellSize + margin * 2;
                
                // Fill background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw QR code
                ctx.fillStyle = '#000000';
                for (let row = 0; row < moduleCount; row++) {
                    for (let col = 0; col < moduleCount; col++) {
                        if (qr.isDark(row, col)) {
                            ctx.fillRect(
                                col * cellSize + margin,
                                row * cellSize + margin,
                                cellSize,
                                cellSize
                            );
                        }
                    }
                }
                
                resolve(canvas.toDataURL('image/png'));
            } catch (error) {
                console.error('Error generating QR code:', error);
                resolve(null);
            }
        });
    }

    async getImageAsBase64(imageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    ctx.drawImage(img, 0, 0);
                    
                    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(dataURL);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            
            // Add timeout to prevent hanging
            setTimeout(() => {
                reject(new Error('Image load timeout'));
            }, 10000);
            
            img.src = imageSrc;
        });
    }

    showSuccessMessage(message) {
        const successDiv = document.getElementById('success-message');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        } else {
            // Fallback: show alert if no success message element
            alert(message);
        }
    }
}

// Initialize PDF generator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicketPDFGenerator();
});
///////////////////////////////////////////////////////////////////////////////////////////////////