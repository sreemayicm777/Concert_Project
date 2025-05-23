// bookTicket.js - PDF Generation with QR Code for Concert Tickets

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const ticketsInput = document.getElementById('tickets');
    const totalPriceSpan = document.getElementById('totalPrice');
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    const bookingForm = document.getElementById('bookingForm');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const paymentMethodSelect = document.getElementById('paymentMethod');

    // Get concert data from the page (you can also pass this from your EJS backend)
    const concertData = {
        name: document.querySelector('.card-title').textContent.trim(),
        artist: document.querySelector('.text-muted')?.textContent.replace('by ', '').trim() || '',
        date: document.querySelector('.meta-item:nth-child(1) p').textContent.trim(),
        time: document.querySelector('.meta-item:nth-child(2) p').textContent.trim(),
        venue: document.querySelector('.meta-item:nth-child(3) p').textContent.trim(),
        city: document.querySelector('.meta-item:nth-child(3) small')?.textContent.trim() || '',
        price: parseFloat(ticketsInput.dataset.price),
        availableTickets: parseInt(ticketsInput.dataset.available),
        genre: document.querySelector('.badge:nth-child(1)')?.textContent.replace(/.*\s/, '').trim() || '',
        duration: document.querySelector('.badge:nth-child(2)')?.textContent.replace(/.*\s/, '').trim() || '',
        ageRestriction: document.querySelector('.badge:nth-child(3)')?.textContent.replace(/.*\s/, '').trim() || ''
    };

    // Update total price when ticket count changes
    ticketsInput.addEventListener('input', function() {
        const ticketCount = parseInt(this.value) || 0;
        const ticketPrice = concertData.price;
        const maxTickets = Math.min(concertData.availableTickets, 3); // Max 3 tickets per order
        
        // Validation
        if (ticketCount > 3) {
            showError("You can only book a maximum of 3 tickets per order.");
            this.value = 3;
            return;
        }
        
        if (ticketCount > concertData.availableTickets) {
            showError(`Only ${concertData.availableTickets} tickets are available.`);
            this.value = concertData.availableTickets;
            return;
        }
        
        if (ticketCount < 1) {
            this.value = 1;
        }
        
        const total = Math.max(1, ticketCount) * ticketPrice;
        totalPriceSpan.textContent = `$${total.toFixed(2)}`;
        hideError();
    });

    // Handle booking confirmation and PDF generation
    confirmBookingBtn.addEventListener('click', function() {
        const ticketCount = parseInt(ticketsInput.value);
        const paymentMethod = paymentMethodSelect.value;

        // Validation
        if (!ticketCount || ticketCount < 1) {
            showError("Please select at least 1 ticket.");
            return;
        }

        if (ticketCount > 3) {
            showError("You can only book a maximum of 3 tickets per order.");
            return;
        }

        if (ticketCount > concertData.availableTickets) {
            showError(`Only ${concertData.availableTickets} tickets are available.`);
            return;
        }

        if (!paymentMethod) {
            showError("Please select a payment method.");
            return;
        }

        // Show loading state
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Processing...';
        this.disabled = true;

        // Generate booking details
        const bookingDetails = {
            bookingId: generateBookingId(),
            customerName: 'Guest Customer', // You can add customer name field if needed
            customerEmail: 'customer@example.com', // You can add email field if needed
            ticketCount: ticketCount,
            paymentMethod: paymentMethod,
            totalAmount: ticketCount * concertData.price,
            bookingDate: new Date().toISOString()
        };

        // Simulate processing delay then generate PDF
        setTimeout(() => {
            try {
                generateTicketPDF(bookingDetails);
                showSuccess("Booking confirmed! Your ticket PDF has been generated and downloaded.");
                
                // Reset form
                ticketsInput.value = 1;
                paymentMethodSelect.value = '';
                totalPriceSpan.textContent = `$${concertData.price.toFixed(2)}`;
                
            } catch (error) {
                console.error('PDF generation error:', error);
                showError("There was an error generating your ticket. Please try again.");
            }
            
            // Reset button
            this.innerHTML = originalText;
            this.disabled = false;
        }, 2000);
    });

    // Generate unique booking ID
    function generateBookingId() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `BK${timestamp}${random}`;
    }

    // Generate QR code data
    function generateQRData(bookingDetails) {
        return JSON.stringify({
            bookingId: bookingDetails.bookingId,
            event: concertData.name,
            artist: concertData.artist,
            venue: concertData.venue,
            date: concertData.date,
            time: concertData.time,
            tickets: bookingDetails.ticketCount,
            customer: bookingDetails.customerName,
            total: bookingDetails.totalAmount,
            validUntil: concertData.date
        });
    }

    // Generate PDF ticket
    function generateTicketPDF(bookingDetails) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Colors
        const primaryColor = [0, 123, 255]; // Bootstrap primary blue
        const darkColor = [33, 37, 41];
        const lightColor = [248, 249, 250];

        // Add header with background
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 35, 'F');

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('CONCERT TICKET', 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text('ConcertHub - Your Gateway to Amazing Events', 105, 25, { align: 'center' });

        // Reset text color
        doc.setTextColor(...darkColor);

        // Concert title and artist
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(concertData.name, 20, 55);

        if (concertData.artist) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text(`by ${concertData.artist}`, 20, 65);
        }

        // Create two columns for details
        let yPos = 85;
        const leftCol = 20;
        const rightCol = 110;

        // Left column - Event Details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('EVENT INFORMATION', leftCol, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const eventDetails = [
            `Date: ${concertData.date}`,
            `Time: ${concertData.time}`,
            `Venue: ${concertData.venue}`,
            `Location: ${concertData.city}`,
            `Genre: ${concertData.genre}`,
            `Duration: ${concertData.duration}`,
            `Age Restriction: ${concertData.ageRestriction}`
        ];

        eventDetails.forEach((detail, index) => {
            if (detail.split(': ')[1]) { // Only show if value exists
                doc.text(detail, leftCol, yPos + 10 + (index * 8));
            }
        });

        // Right column - Booking Details
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('BOOKING INFORMATION', rightCol, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const bookingInfo = [
            `Booking ID: ${bookingDetails.bookingId}`,
            `Customer: ${bookingDetails.customerName}`,
            `Email: ${bookingDetails.customerEmail}`,
            `Number of Tickets: ${bookingDetails.ticketCount}`,
            `Payment Method: ${bookingDetails.paymentMethod}`,
            `Booking Date: ${new Date(bookingDetails.bookingDate).toLocaleDateString()}`,
            `Total Amount: $${bookingDetails.totalAmount.toFixed(2)}`
        ];

        bookingInfo.forEach((info, index) => {
            doc.text(info, rightCol, yPos + 10 + (index * 8));
        });

        // Add QR Code section
        yPos = 160;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('ENTRY QR CODE', leftCol, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Present this QR code at the venue entrance', leftCol, yPos + 8);
        doc.text('along with a valid photo ID for entry.', leftCol, yPos + 16);

        // Generate QR code
        const qrData = generateQRData(bookingDetails);
        const canvas = document.createElement('canvas');
        
        // Create QR code
        const qr = new QRCode(canvas, {
            text: qrData,
            width: 100,
            height: 100,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        // Wait for QR code generation
        setTimeout(() => {
            try {
                const qrDataURL = canvas.toDataURL('image/png');
                doc.addImage(qrDataURL, 'PNG', leftCol, yPos + 25, 40, 40);
            } catch (error) {
                console.warn('QR code generation failed, adding placeholder');
                doc.setFillColor(200, 200, 200);
                doc.rect(leftCol, yPos + 25, 40, 40, 'F');
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(8);
                doc.text('QR CODE', leftCol + 20, yPos + 47, { align: 'center' });
                doc.setTextColor(...darkColor);
            }

            // Add important notes
            yPos = 220;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('IMPORTANT NOTES:', leftCol, yPos);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const notes = [
                '• Arrive at least 30 minutes before the event starts',
                '• This ticket is non-refundable and non-transferable',
                '• Security checks may be conducted at the entrance',
                '• Photography and recording may be restricted during the event',
                '• Keep this ticket safe - lost tickets cannot be replaced'
            ];

            notes.forEach((note, index) => {
                doc.text(note, leftCol, yPos + 10 + (index * 6));
            });

            // Footer
            doc.setFillColor(...lightColor);
            doc.rect(0, 270, 210, 27, 'F');
            
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(8);
            doc.text('Thank you for choosing ConcertHub! For support: support@concerthub.com', 105, 280, { align: 'center' });
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 287, { align: 'center' });
            doc.text(`Booking Reference: ${bookingDetails.bookingId}`, 105, 294, { align: 'center' });

            // Add border
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(1);
            doc.rect(5, 5, 200, 287);

            // Save PDF
            const fileName = `Concert_Ticket_${bookingDetails.bookingId}.pdf`;
            doc.save(fileName);

        }, 500); // Wait for QR code generation
    }

    // Utility functions
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Initialize total price
    const initialTickets = parseInt(ticketsInput.value) || 1;
    totalPriceSpan.textContent = `$${(initialTickets * concertData.price).toFixed(2)}`;
});