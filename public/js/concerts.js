document.addEventListener('DOMContentLoaded', function() {
    // Handle booking form submissions
    const bookingForms = document.querySelectorAll('.booking-form');
    
    bookingForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            
            try {
                // Show loading state
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
                
                const response = await fetch('/bookings', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    window.location.href = '/bookings?success=true';
                } else {
                    alert(result.message || 'Booking failed. Please try again.');
                }
            } catch (error) {
                console.error('Booking error:', error);
                alert('An error occurred during booking.');
            } finally {
                // Reset button state
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        });
    });
    
    // Show success message if redirected from successful booking
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('success')) {
        alert('Booking successful!');
    }
});