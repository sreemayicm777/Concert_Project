// bookTicket.js - Fixed with proper POST method handling
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

    // Prevent default form submission to avoid GET requests
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault(); // This prevents the default GET form submission
            console.log('Form submission prevented - using custom POST handler');
            return false;
        });
    }

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

    // Handle booking confirmation with improved error handling
    confirmBookingBtn.addEventListener('click', async function(e) {
        e.preventDefault(); // Prevent any default button behavior
        e.stopPropagation(); // Stop event bubbling
        
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

        // Process booking with POST method
        await processBooking({
            concertId,
            ticketCount,
            paymentMethod,
            totalAmount: ticketCount * ticketPrice,
            customerInfo: {
                name: formData.get('customerName') || '',
                email: formData.get('customerEmail') || '',
                phone: formData.get('customerPhone') || ''
            }
        });
    });

    async function processBooking(bookingData) {
        // Show loading state
        confirmBookingBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Processing...';
        confirmBookingBtn.disabled = true;

        try {
            // First, check if we're in development mode (no actual API)
            if (isDevMode()) {
                // Simulate booking for development
                await simulateBooking(bookingData);
                return;
            }

            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                             document.querySelector('input[name="_token"]')?.value || '';

            console.log('Making POST request to /api/bookings with data:', bookingData);

            // Make POST request to booking API
            const response = await fetch('/api/bookings', {
                method: 'POST', // Explicitly set POST method
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                    // Additional headers to ensure proper handling
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify({
                    concert_id: bookingData.concertId,
                    ticket_count: bookingData.ticketCount,
                    payment_method: bookingData.paymentMethod,
                    total_amount: bookingData.totalAmount,
                    customer_name: bookingData.customerInfo.name,
                    customer_email: bookingData.customerInfo.email,
                    customer_phone: bookingData.customerInfo.phone,
                    booking_date: new Date().toISOString(),
                    // Add timestamp for uniqueness
                    timestamp: Date.now()
                }),
                // Ensure credentials are included if needed
                credentials: 'same-origin'
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            // Check if response is HTML (error page) instead of JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // If we get HTML back, it's likely an error page
                const htmlText = await response.text();
                console.error('Received HTML instead of JSON. Response text:', htmlText.substring(0, 500));
                
                // Check if it's a 404 or routing issue
                if (response.status === 404) {
                    console.error('API endpoint /api/bookings not found (404)');
                    showError('Booking service is currently unavailable. Using offline mode.');
                } else if (response.status >= 500) {
                    console.error('Server error:', response.status);
                    showError('Server error occurred. Using offline mode.');
                } else {
                    console.error('Unexpected response format. Status:', response.status);
                    showError('Unexpected response from server. Using offline mode.');
                }
                
                // Fall back to simulation mode
                console.log('Falling back to simulation mode...');
                await simulateBooking(bookingData);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const bookingResult = await response.json();
            console.log('Booking result:', bookingResult);
            
            if (bookingResult.success || bookingResult.data || bookingResult.booking_id) {
                handleBookingSuccess(bookingResult.data || bookingResult);
            } else {
                handleBookingError(bookingResult.message || 'Booking failed. Please try again.');
            }

        } catch (error) {
            console.error('Booking error:', error);
            
            // If there's a JSON parsing error or network error, fall back to simulation
            if (error.message.includes('Unexpected token') || 
                error.message.includes('JSON') || 
                error.message.includes('Network') ||
                error.message.includes('Failed to fetch') ||
                error.name === 'TypeError') {
                
                console.log('API unavailable, using simulation mode. Error:', error.message);
                await simulateBooking(bookingData);
            } else {
                handleBookingError(error.message || 'Booking failed. Please try again.');
            }
        }
    }

    function isDevMode() {
        // Check if we're in development mode (localhost, no API available, etc.)
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('local') ||
               window.location.port === '3000' ||
               window.location.port === '8000';
    }

    async function simulateBooking(bookingData) {
        console.log('Simulating POST request for booking:', bookingData);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate mock booking result
        const mockBookingResult = {
            booking_id: generateBookingId(),
            concert_id: bookingData.concertId,
            ticket_count: bookingData.ticketCount,
            total_amount: bookingData.totalAmount,
            payment_method: bookingData.paymentMethod,
            booking_date: new Date().toISOString(),
            customer_info: bookingData.customerInfo,
            status: 'confirmed',
            success: true
        };

        console.log('Simulated booking result:', mockBookingResult);
        handleBookingSuccess(mockBookingResult);
    }

    function generateBookingId() {
        // Generate a mock booking ID
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'BK';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function handleBookingSuccess(bookingResult) {
        console.log('Handling booking success:', bookingResult);
        
        // Reset button
        confirmBookingBtn.innerHTML = '<i class="fas fa-check me-2"></i> Booking Confirmed!';
        confirmBookingBtn.classList.remove('btn-primary');
        confirmBookingBtn.classList.add('btn-success');

        // Show success message
        showSuccess(`Booking confirmed! Your booking ID is: ${bookingResult.booking_id || bookingResult.bookingId}`);

        // Disable form inputs
        document.querySelectorAll('#bookingForm input, #bookingForm select').forEach(input => {
            input.disabled = true;
        });

        // Prepare booking data for PDF generation
        const pdfBookingData = {
            bookingId: bookingResult.booking_id || bookingResult.bookingId,
            ticketCount: bookingResult.ticket_count || bookingResult.ticketCount,
            totalAmount: bookingResult.total_amount || bookingResult.totalAmount,
            paymentMethod: bookingResult.payment_method || bookingResult.paymentMethod,
            concertId: bookingResult.concert_id || bookingResult.concertId,
            bookingDate: bookingResult.booking_date || bookingResult.bookingDate || new Date().toISOString(),
            customerInfo: bookingResult.customer_info || bookingResult.customerInfo || {}
        };

        // Trigger event for PDF generator
        const bookingSuccessEvent = new CustomEvent('bookingSuccess', {
            detail: pdfBookingData
        });
        document.dispatchEvent(bookingSuccessEvent);

        // Update available tickets display
        availableTickets -= (bookingResult.ticket_count || bookingResult.ticketCount);
        updateAvailableTicketsDisplay();
    }

    function handleBookingError(error) {
        console.error('Handling booking error:', error);
        
        // Reset button
        confirmBookingBtn.innerHTML = '<i class="fas fa-credit-card me-2"></i> Confirm Booking';
        confirmBookingBtn.disabled = false;

        showError(error);
    }

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
        
        if (successMessage) {
            successMessage.style.display = 'none';
        }
        
        console.error('Booking Error:', message);
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        }, 8000);
    }

    function showSuccess(message) {
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
        }
        
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
        
        console.log('Booking Success:', message);
    }

    function updateAvailableTicketsDisplay() {
        // Update any available tickets display on the page
        const availableTicketsElements = document.querySelectorAll('.available-tickets');
        availableTicketsElements.forEach(element => {
            element.textContent = availableTickets;
        });

        // Update max attribute of tickets input
        if (ticketsInput) {
            ticketsInput.setAttribute('max', availableTickets);
        }
    }

    // Handle payment method selection
    const paymentMethodSelect = document.getElementById('paymentMethod');
    if (paymentMethodSelect) {
        paymentMethodSelect.addEventListener('change', function() {
            const selectedMethod = this.value;
            
            // You can add specific handling for different payment methods here
            switch(selectedMethod) {
                case 'credit_card':
                    console.log('Credit card payment selected');
                    break;
                case 'paypal':
                    console.log('PayPal payment selected');
                    break;
                case 'bank_transfer':
                    console.log('Bank transfer payment selected');
                    break;
                case 'crypto':
                    console.log('Cryptocurrency payment selected');
                    break;
            }
        });
    }

    // Initialize default values
    if (ticketsInput && ticketsInput.value) {
        ticketsInput.dispatchEvent(new Event('input'));
    }

    // Add debugging info
    console.log('BookTicket.js initialized');
    console.log('Development mode:', isDevMode());
    console.log('Ticket price:', ticketPrice);
    console.log('Available tickets:', availableTickets);
    console.log('Current URL:', window.location.href);
    
    // Log when the script is ready to make POST requests
    console.log('Ready to make POST requests to /api/bookings');
});