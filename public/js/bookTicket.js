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