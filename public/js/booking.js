// concerts.js
document.addEventListener('DOMContentLoaded', function() {
  // Add confirmation for booking buttons
  const bookButtons = document.querySelectorAll('.btn-book');
  
  bookButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      const concertName = this.closest('.card').querySelector('.card-title').textContent;
      if (!confirm(`Are you sure you want to book tickets for ${concertName}?`)) {
        e.preventDefault();
      }
    });
  });

  // Add search functionality if you have a search input
  const searchInput = document.getElementById('concert-search');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const cards = document.querySelectorAll('.col');
      
      cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const venue = card.querySelector('.card-text [class*="fa-map-marker-alt"]').parentElement.textContent.toLowerCase();
        
        if (title.includes(searchTerm) || venue.includes(searchTerm)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // Add date filtering if you have date filter elements
  const dateFilter = document.getElementById('date-filter');
  if (dateFilter) {
    dateFilter.addEventListener('change', function() {
      const selectedDate = new Date(this.value);
      const cards = document.querySelectorAll('.col');
      
      cards.forEach(card => {
        const dateText = card.querySelector('.card-text [class*="fa-calendar-day"]').parentElement.textContent;
        const concertDate = new Date(dateText.replace(' ', ''));
        
        if (this.value === '' || concertDate.toDateString() === selectedDate.toDateString()) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
});