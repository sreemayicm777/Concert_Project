document.addEventListener('DOMContentLoaded', function() {
  // Price Calculator
  const ticketSelect = document.getElementById('tickets');
  const priceDisplay = document.getElementById('totalPrice');
  const ticketPrice = parseFloat(ticketSelect.dataset.price);

  function calculateTotal() {
    const total = (ticketSelect.value * ticketPrice).toFixed(2);
    priceDisplay.textContent = `$${total}`;
  }

  // Initialize and update on change
  calculateTotal();
  ticketSelect.addEventListener('change', calculateTotal);

  // Form Submission Handling
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const tickets = parseInt(ticketSelect.value);
      const concertId = bookingForm.querySelector('[name="concertId"]').value;
      
      // Show loading state
      const submitBtn = bookingForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Processing...';

      try {
        const response = await fetch('/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            concertId: concertId,
            tickets: tickets
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          window.location.href = `/bookings/${result.booking._id}`;
        } else {
          alert(result.message || 'Booking failed');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during booking');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-credit-card me-2"></i> Confirm Booking';
      }
    });
  }
});






document.getElementById('tickets').addEventListener('input', function() {
  const ticketCount = parseInt(this.value);
  const errorDiv = document.getElementById('ticket-error');
  const maxTickets = 3;
  
  if (ticketCount > maxTickets) {
    // Show error message
    errorDiv.style.display = 'block';
    this.classList.add('is-invalid');
    
    // Optionally reset the value to max allowed
    // this.value = maxTickets;
  } else {
    // Hide error message
    errorDiv.style.display = 'none';
    this.classList.remove('is-invalid');
  }
});

// Alternative: Show alert instead of inline error
document.getElementById('tickets').addEventListener('blur', function() {
  const ticketCount = parseInt(this.value);
  const maxTickets = 3;
  
  if (ticketCount > maxTickets) {
    alert('Maximum 3 tickets allowed per booking!');
    this.value = maxTickets;
  }
});






//   document.getElementById('confirmBookingBtn').addEventListener('click', async function() {
//     // 1. First submit the form data to your server
//     const form = document.getElementById('bookingForm');
//     const formData = new FormData(form);
    
//     try {
//       const response = await fetch('/bookings', {
//         method: 'POST',
//         body: formData
//       });
      
//       const result = await response.json();
      
//       if (response.ok) {
//         // 2. Generate PDF with QR code after successful booking
//         generateTicketPDF(result.booking);
//       } else {
//         alert('Booking failed: ' + (result.message || 'Unknown error'));
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       alert('An error occurred during booking');
//     }
//   });

//   function generateTicketPDF(bookingData) {
//     // Initialize jsPDF
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();
    
//     // Add concert details
//     doc.setFontSize(18);
//     doc.text(`Concert Ticket - ${bookingData.concert.name}`, 15, 20);
    
//     doc.setFontSize(12);
//     doc.text(`Date: ${new Date(bookingData.concert.date).toLocaleDateString()}`, 15, 35);
//     doc.text(`Venue: ${bookingData.concert.venue}`, 15, 45);
//     doc.text(`Tickets: ${bookingData.tickets}`, 15, 55);
//     doc.text(`Total Paid: $${(bookingData.tickets * bookingData.concert.ticketPrice).toFixed(2)}`, 15, 65);
    
//     // Generate QR code
//     const qrCodeData = `ConcertHubTicket:${bookingData._id}|${bookingData.user}|${bookingData.concert._id}`;
//     const qrCodeElement = document.createElement('div');
//     new QRCode(qrCodeElement, {
//       text: qrCodeData,
//       width: 80,
//       height: 80
//     });
    
//     // Add QR code to PDF
//     const qrCodeImg = qrCodeElement.querySelector('img');
//     doc.addImage(qrCodeImg, 'PNG', 140, 30, 50, 50);
    
//     // Save the PDF
//     doc.save(`ConcertHub-Ticket-${bookingData._id}.pdf`);
    
//     // Redirect after download
//     window.location.href = `/bookings/${bookingData._id}`;
//   }



 function generateTicketPDF(bookingData) {
    return new Promise((resolve, reject) => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Simple ticket design - customize as needed
            doc.setFontSize(20);
            doc.text(`Ticket for ${bookingData.concert.name}`, 10, 10);
            
            doc.setFontSize(12);
            doc.text(`Date: ${new Date(bookingData.concert.date).toLocaleDateString()}`, 10, 20);
            doc.text(`Venue: ${bookingData.concert.venue}`, 10, 30);
            doc.text(`Tickets: ${bookingData.tickets}`, 10, 40);
            
            // Generate QR Code
            const qrCodeElement = document.createElement('div');
            new QRCode(qrCodeElement, {
                text: `BookingID:${bookingData._id}`,
                width: 50,
                height: 50
            });
            
            const qrCodeImg = qrCodeElement.querySelector('img');
            doc.addImage(qrCodeImg, 'PNG', 10, 50, 50, 50);
            
            doc.save(`ticket-${bookingData._id}.pdf`);
            resolve();
        } catch (error) {
            console.error('PDF generation failed:', error);
            reject('Failed to generate ticket');
        }
    });
}
  // Add this to your existing generateTicketPDF function
  async function generateTicketPDF(bookingData) {
    return new Promise((resolve, reject) => {
      try {
        // ... existing PDF generation code ...
        doc.save(`ConcertHub-Ticket-${bookingData._id}.pdf`);
        resolve();
      } catch (error) {
        console.error('PDF generation failed:', error);
        reject('Failed to generate ticket PDF');
      }
    });
  }




  // Add this after your existing script
document.getElementById('tickets').addEventListener('input', function() {
  const ticketInput = this;
  const errorDiv = document.getElementById('ticket-error');
  const available = parseInt(ticketInput.dataset.available);
  const maxAllowed = Math.min(available, 3); // Maximum 3 tickets
  
  if (ticketInput.value > maxAllowed) {
    ticketInput.classList.add('is-invalid');
    errorDiv.style.display = 'block';
    ticketInput.value = maxAllowed;
  } else {
    ticketInput.classList.remove('is-invalid');
    errorDiv.style.display = 'none';
  }
  
  // Update total price
  const price = parseFloat(ticketInput.dataset.price);
  document.getElementById('totalPrice').textContent = '$' + (price * ticketInput.value).toFixed(2);
});



// Add this to validate payment method selection
document.getElementById('paymentMethod').addEventListener('change', function() {
  if (this.value === '') {
    this.classList.add('is-invalid');
  } else {
    this.classList.remove('is-invalid');
  }
});


document.getElementById('confirmBookingBtn').addEventListener('click', function() {
  console.log("Button clicked!"); // Check browser console for this message
  alert("Button working!"); // Simple visible test
});