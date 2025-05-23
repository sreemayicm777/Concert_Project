// bookTicket.js - Updated to work with PDF generation
document.addEventListener('DOMContentLoaded', function() {
    const ticketsInput = document.getElementById('tickets');
    const totalPriceSpan = document.getElementById('totalPrice');
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    const bookingForm = document.getElementById('bookingForm');
    const ticketError = document.getElementById('ticket-error');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    let ticketPrice = parseFloat(ticketsInput.getAttribute('data-price')) || 0;
    let availableTickets = parseInt(ticketsInput.getAttribute('data-available')) || 0;

    // Update total price when ticket count changes
    ticketsInput.addEventListener('input', function() {
        const ticketCount = parseInt(this.value) || 1;
        
        // Validate ticket count
        if (ticketCount > 3) {
            ticketError.style.display = 'block';
            confirmBookingBtn.disabled = true;
            return;
        } else {
            ticketError.style.display = 'none';
            confirmBookingBtn.disabled = false;
        }

        if (ticketCount > availableTickets) {
            showError(`Only ${availableTickets} tickets are available.`);
            confirmBookingBtn.disabled = true;
            return;
        }

        const totalPrice = ticketCount * ticketPrice;
        totalPriceSpan.textContent = `$${totalPrice.toFixed(2)}`;
    });

    // Handle booking confirmation
    confirmBookingBtn.addEventListener('click', function() {
        const formData = new FormData(bookingForm);
        const ticketCount = parseInt(formData.get('ticketCount'));
        const paymentMethod = formData.get('paymentMethod');
        const concertId = formData.get('concertId');

        // Validation
        if (!ticketCount || ticketCount < 1) {
            showError('Please enter a valid number of tickets.');
            return;
        }

        if (ticketCount > 3) {
            showError('Maximum 3 tickets per booking.');
            return;
        }

        if (!paymentMethod) {
            showError('Please select a payment method.');
            return;
        }

        if (ticketCount > availableTickets) {
            showError(`Only ${availableTickets} tickets are available.`);
            return;
        }

        // Simulate booking process
        processBooking({
            concertId,
            ticketCount,
            paymentMethod,
            totalAmount: ticketCount * ticketPrice
        });
    });

    function processBooking(bookingData) {
        // Show loading state
        confirmBookingBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Processing...';
        confirmBookingBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            // Simulate successful booking
            const bookingResult = {
                success: true,
                bookingId: generateBookingId(),
                ticketCount: bookingData.ticketCount,
                totalAmount: bookingData.totalAmount,
                paymentMethod: bookingData.paymentMethod,
                concertId: bookingData.concertId,
                bookingDate: new Date().toISOString()
            };

            if (bookingResult.success) {
                handleBookingSuccess(bookingResult);
            } else {
                handleBookingError('Booking failed. Please try again.');
            }
        }, 2000);
    }

    function handleBookingSuccess(bookingResult) {
        // Reset button
        confirmBookingBtn.innerHTML = '<i class="fas fa-check me-2"></i> Booking Confirmed!';
        confirmBookingBtn.classList.remove('btn-primary');
        confirmBookingBtn.classList.add('btn-success');

        // Show success message
        showSuccess(`Booking confirmed! Your booking ID is: ${bookingResult.bookingId}`);

        // Disable form inputs
        document.querySelectorAll('#bookingForm input, #bookingForm select').forEach(input => {
            input.disabled = true;
        });

        // Trigger event for PDF generator
        const bookingSuccessEvent = new CustomEvent('bookingSuccess', {
            detail: bookingResult
        });
        document.dispatchEvent(bookingSuccessEvent);

        // Update available tickets display
        availableTickets -= bookingResult.ticketCount;
        updateAvailableTicketsDisplay();
    }

    function handleBookingError(error) {
        // Reset button
        confirmBookingBtn.innerHTML = '<i class="fas fa-credit-card me-2"></i> Confirm Booking';
        confirmBookingBtn.disabled = false;

        showError(error);
    }

    function generateBookingId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `CH${timestamp}${randomStr}`.toUpperCase();
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    function updateAvailableTicketsDisplay() {
        // Update any available tickets display on the page
        const availableTicketsElements = document.querySelectorAll('.available-tickets');
        availableTicketsElements.forEach(element => {
            element.textContent = availableTickets;
        });

        // Update max attribute of tickets input
        ticketsInput.setAttribute('max', availableTickets);
    }

    // Handle payment method selection
    document.getElementById('paymentMethod').addEventListener('change', function() {
        const selectedMethod = this.value;
        
        // You can add specific handling for different payment methods here
        switch(selectedMethod) {
            case 'credit_card':
                // Handle credit card selection
                console.log('Credit card payment selected');
                break;
            case 'paypal':
                // Handle PayPal selection
                console.log('PayPal payment selected');
                break;
            case 'bank_transfer':
                // Handle bank transfer selection
                console.log('Bank transfer payment selected');
                break;
            case 'crypto':
                // Handle cryptocurrency selection
                console.log('Cryptocurrency payment selected');
                break;
        }
    });

    // Initialize default values
    if (ticketsInput.value) {
        ticketsInput.dispatchEvent(new Event('input'));
    }
});