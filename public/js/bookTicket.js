document.addEventListener('DOMContentLoaded', function() {
  // Initialize with concert price from template
  const concertPrice = parseFloat("<%= concert.ticketPrice %>");
  updateTotalPrice(concertPrice);
  
  // Ticket count change handler
  document.getElementById('ticketCount').addEventListener('change', function() {
    updateTotalPrice(concertPrice);
  });

  // Booking form submission
  document.getElementById('bookingForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
      // Disable submit button during processing
      const submitBtn = this.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
      
      // Create booking data
      const bookingData = {
        concertId: this.elements.concertId.value,
        userId: this.elements.userId.value,
        username: this.elements.username.value,
        ticketCount: this.elements.ticketCount.value,
        totalPrice: this.elements.totalPriceHidden.value,
        paymentMethod: this.elements.paymentMethod.value
      };

      // Submit to server
      const response = await fetch(this.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        showSuccess('Booking confirmed! Download your ticket below.');
        
        // Store booking data for PDF generation with template data
        window.currentBooking = {
          ...result.booking,
          concertDetails: {
            name: '<%= concert.name %>',
            artist: '<%= concert.artist %>',
            date: '<%= new Date(concert.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) %>',
            time: '<%= concert.time %>',
            venue: '<%= concert.venue %>',
            image: '<%= concert.image || "/images/default-concert.jpg" %>',
            price: concertPrice
          }
        };
        
        // Show download button
        document.getElementById('downloadPdfBtn').style.display = 'block';
        
        // Disable form after successful booking
        disableFormAfterBooking();
      } else {
        showError(result.message || 'Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('An error occurred during booking');
    } finally {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-ticket-alt me-2"></i> Confirm Booking';
      }
    }
  });

  // PDF Download handler
  document.getElementById('downloadPdfBtn').addEventListener('click', function() {
    if (!window.currentBooking) {
      showError('Please complete your booking first');
      return;
    }
    
    try {
      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...';
      
      // Generate and download PDF
      if (window.concertTicketPDF) {
        window.concertTicketPDF.generateTicketPDF(window.currentBooking);
      } else if (window.ConcertHubPDF) {
        window.ConcertHubPDF.generateAndDownload(window.currentBooking);
      } else {
        throw new Error('PDF generator not available');
      }
    } catch (error) {
      console.error('PDF error:', error);
      showError('Failed to generate ticket');
    } finally {
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-download me-2"></i> Download Ticket';
    }
  });

  // Function to disable form after booking
  function disableFormAfterBooking() {
    const form = document.getElementById('bookingForm');
    const inputs = form.querySelectorAll('input, select, button');
    
    inputs.forEach(input => {
      if (input.type !== 'button' && input.id !== 'downloadPdfBtn') {
        input.disabled = true;
      }
    });
    
    // Change submit button text and style
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i> Booked Successfully';
      submitBtn.classList.remove('btn-success');
      submitBtn.classList.add('btn-secondary');
    }
  }
});

// Update total price calculation
function updateTotalPrice(pricePerTicket) {
  const ticketCount = parseInt(document.getElementById('ticketCount').value) || 1;
  const totalPrice = (ticketCount * pricePerTicket).toFixed(2);
  
  // Update both display and hidden field
  document.getElementById('totalPrice').value = '$' + totalPrice;
  document.getElementById('totalPriceHidden').value = totalPrice;
}

// Show error message
function showError(message) {
  const element = document.getElementById('error-message');
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => element.style.display = 'none', 5000);
  }
}

// Show success message
function showSuccess(message) {
  const element = document.getElementById('success-message');
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
    // Don't auto-hide success messages
  }
}