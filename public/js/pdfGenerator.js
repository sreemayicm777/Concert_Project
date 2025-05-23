// pdfGenerator.js
class TicketPDFGenerator {
    constructor() {
        this.bookingData = null;
        this.concertData = null;
        this.init();
    }

    init() {
        // Get concert data from the hidden script tag
        const concertDataElement = document.getElementById('concertData');
        if (concertDataElement) {
            this.concertData = JSON.parse(concertDataElement.textContent);
        }

        // Listen for successful booking to enable PDF download
        document.addEventListener('bookingSuccess', (event) => {
            this.bookingData = event.detail;
            this.showDownloadButton();
        });

        // Add event listener for PDF download button
        document.getElementById('downloadPdfBtn').addEventListener('click', () => {
            this.generatePDF();
        });
    }

    showDownloadButton() {
        const downloadBtn = document.getElementById('downloadPdfBtn');
        downloadBtn.style.display = 'block';
        downloadBtn.scrollIntoView({ behavior: 'smooth' });
    }

    async generatePDF() {
        if (!this.bookingData || !this.concertData) {
            alert('Booking data not available. Please complete your booking first.');
            return;
        }

        try {
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
                const imageData = await this.getImageAsBase64(this.concertData.image);
                if (imageData) {
                    doc.addImage(imageData, 'JPEG', 15, ticketY + 10, 60, 40);
                }
            } catch (error) {
                // Fallback: draw a placeholder rectangle
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
            doc.text(this.concertData.name, 85, ticketY + 20);

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
            doc.text(this.concertData.time, leftColX, detailsY + 16);

            // Venue
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('📍 VENUE', rightColX, detailsY);
            
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(this.concertData.venue, rightColX, detailsY + 8);
            if (this.concertData.city) {
                doc.text(`${this.concertData.city}, ${this.concertData.country}`, rightColX, detailsY + 16);
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
            doc.text(`Tickets: ${this.bookingData.ticketCount}`, leftColX, ticketInfoY + 10);
            doc.text(`Price per ticket: $${this.concertData.price.toFixed(2)}`, leftColX, ticketInfoY + 18);
            doc.text(`Total Amount: $${this.bookingData.totalAmount.toFixed(2)}`, leftColX, ticketInfoY + 26);
            doc.text(`Payment Method: ${this.bookingData.paymentMethod.replace('_', ' ').toUpperCase()}`, leftColX, ticketInfoY + 34);

            // Booking ID
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('BOOKING ID', rightColX, ticketInfoY);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(this.bookingData.bookingId, rightColX, ticketInfoY + 10);

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
            const qrCodeData = this.generateQRCodeData();
            const qrCodeDataURL = await this.generateQRCode(qrCodeData);
            
            if (qrCodeDataURL) {
                doc.addImage(qrCodeDataURL, 'PNG', 15, qrY + 20, 40, 40);
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
            const fileName = `${this.concertData.name.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket_${this.bookingData.bookingId}.pdf`;
            doc.save(fileName);

            // Show success message
            this.showSuccessMessage('PDF ticket downloaded successfully!');

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    }

    generateQRCodeData() {
        return JSON.stringify({
            bookingId: this.bookingData.bookingId,
            concertId: this.concertData.id,
            concertName: this.concertData.name,
            venue: this.concertData.venue,
            date: this.concertData.date,
            time: this.concertData.time,
            tickets: this.bookingData.ticketCount,
            totalAmount: this.bookingData.totalAmount,
            timestamp: new Date().toISOString()
        });
    }

    async generateQRCode(data) {
        return new Promise((resolve) => {
            try {
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
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                
                try {
                    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(dataURL);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
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
        }
    }
}

// Initialize PDF generator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicketPDFGenerator();
});