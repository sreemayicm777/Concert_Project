// Handle cancel booking modal
    document.addEventListener('DOMContentLoaded', function() {
      const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));
      const cancelForm = document.getElementById('cancel-form');
      const cancelDetails = document.getElementById('cancel-booking-details');

      document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const bookingId = this.dataset.bookingId;
          const concertName = this.dataset.concertName;
          const tickets = this.dataset.tickets;
          
          cancelForm.action = `/my-bookings/${bookingId}/cancel`;
          cancelDetails.innerHTML = `
            <div class="card">
              <div class="card-body">
                <h6 class="card-title">${concertName}</h6>
                <p class="card-text">Number of tickets: <strong>${tickets}</strong></p>
              </div>
            </div>
          `;
          
          cancelModal.show();
        });
      });

      // Auto-hide alerts after 5 seconds
      setTimeout(() => {
        document.querySelectorAll('.alert-dismissible').forEach(alert => {
          const bsAlert = new bootstrap.Alert(alert);
          bsAlert.close();
        });
      }, 5000);
    });