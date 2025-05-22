document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('concert-search');
  const dateFilter = document.getElementById('date-filter');
  const clearDateBtn = document.getElementById('clear-date');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const concertsContainer = document.getElementById('concerts-container');
  const noResultsMsg = document.getElementById('no-results');
  const resultsSummary = document.getElementById('results-summary');
  const resultsCount = document.getElementById('results-count');
  const pageInfo = document.getElementById('page-info');
  const showMoreContainer = document.getElementById('show-more-container');
  const showMoreBtn = document.getElementById('show-more-btn');
  const remainingCount = document.getElementById('remaining-count');
  const paginationNav = document.getElementById('pagination-nav');
  const paginationList = document.getElementById('pagination-list');
  const paginationInfo = document.getElementById('pagination-info');
  const itemsPerPageDropdown = document.getElementById('itemsPerPageDropdown');
  const currentPerPageSpan = document.getElementById('current-per-page');
  
  // Pagination settings
  let currentPage = 1;
  let itemsPerPage = 6;
  let paginationType = 'pagination'; // 'pagination' or 'showmore'
  let filteredConcerts = [];
  let showMoreIndex = 0;
  
  // Get all concert cards
  function getConcertCards(includeHidden = false) {
    const cards = document.querySelectorAll('.concert-card');
    if (includeHidden) return Array.from(cards);
    return Array.from(cards).filter(card => card.style.display !== 'none');
  }
  
  // Filter concerts by search and date
  function filterConcerts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedDate = dateFilter.value;
    const allCards = getConcertCards(true);
    
    filteredConcerts = allCards.filter(card => {
      let showCard = true;
      
      // Search filter
      if (searchTerm) {
        const title = card.dataset.title || '';
        const venue = card.dataset.venue || '';
        showCard = title.includes(searchTerm) || venue.includes(searchTerm);
      }
      
      // Date filter
      if (showCard && selectedDate) {
        const concertDate = card.dataset.date;
        showCard = concertDate === selectedDate;
      }
      
      return showCard;
    });
    
    // Reset pagination
    currentPage = 1;
    showMoreIndex = 0;
    
    updateDisplay();
  }
  
  // Update display based on current filters and pagination
  function updateDisplay() {
    const allCards = getConcertCards(true);
    
    // Hide all cards first
    allCards.forEach(card => {
      card.style.display = 'none';
      card.style.opacity = '0';
    });
    
    // Show filtered cards with pagination
    let startIndex = 0;
    let endIndex = filteredConcerts.length;
    
    if (itemsPerPage > 0) {
      if (paginationType === 'pagination') {
        startIndex = (currentPage - 1) * itemsPerPage;
        endIndex = Math.min(startIndex + itemsPerPage, filteredConcerts.length);
      } else {
        // Show more functionality
        endIndex = Math.min(showMoreIndex + itemsPerPage, filteredConcerts.length);
      }
    }
    
    const cardsToShow = filteredConcerts.slice(startIndex, endIndex);
    
    // Show the cards with animation
    cardsToShow.forEach((card, index) => {
      setTimeout(() => {
        card.style.display = '';
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
      }, index * 50);
    });
    
    updatePaginationControls();
    updateResultsSummary();
    
    // Show/hide no results message
    if (filteredConcerts.length === 0) {
      noResultsMsg.style.display = 'block';
      concertsContainer.style.display = 'none';
      document.getElementById('pagination-container').style.display = 'none';
    } else {
      noResultsMsg.style.display = 'none';
      concertsContainer.style.display = '';
      document.getElementById('pagination-container').style.display = 'block';
    }
  }
  
  // Update pagination controls
  function updatePaginationControls() {
    if (itemsPerPage === 0 || filteredConcerts.length <= itemsPerPage) {
      showMoreContainer.style.display = 'none';
      paginationNav.style.display = 'none';
      return;
    }
    
    if (paginationType === 'showmore') {
      updateShowMoreButton();
      paginationNav.style.display = 'none';
    } else {
      updatePagination();
      showMoreContainer.style.display = 'none';
    }
  }
  
  // Update show more button
  function updateShowMoreButton() {
    const currentShowing = Math.min(showMoreIndex + itemsPerPage, filteredConcerts.length);
    const remaining = filteredConcerts.length - currentShowing;
    
    if (remaining > 0) {
      showMoreContainer.style.display = 'block';
      remainingCount.textContent = remaining;
      showMoreBtn.innerHTML = `
        <i class="fas fa-chevron-down me-2"></i>
        Show More Concerts
        <span class="badge bg-primary ms-2">${remaining}</span>
      `;
    } else {
      showMoreContainer.style.display = 'none';
    }
  }
  
  // Update traditional pagination
  function updatePagination() {
    const totalPages = Math.ceil(filteredConcerts.length / itemsPerPage);
    
    if (totalPages <= 1) {
      paginationNav.style.display = 'none';
      return;
    }
    
    paginationNav.style.display = 'block';
    paginationList.innerHTML = '';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></a>`;
    paginationList.appendChild(prevLi);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
      const firstLi = document.createElement('li');
      firstLi.className = 'page-item';
      firstLi.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`;
      paginationList.appendChild(firstLi);
      
      if (startPage > 2) {
        const dotsLi = document.createElement('li');
        dotsLi.className = 'page-item disabled';
        dotsLi.innerHTML = `<span class="page-link">...</span>`;
        paginationList.appendChild(dotsLi);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === currentPage ? 'active' : ''}`;
      li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
      paginationList.appendChild(li);
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const dotsLi = document.createElement('li');
        dotsLi.className = 'page-item disabled';
        dotsLi.innerHTML = `<span class="page-link">...</span>`;
        paginationList.appendChild(dotsLi);
      }
      
      const lastLi = document.createElement('li');
      lastLi.className = 'page-item';
      lastLi.innerHTML = `<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>`;
      paginationList.appendChild(lastLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></a>`;
    paginationList.appendChild(nextLi);
    
    // Update pagination info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredConcerts.length);
    paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${filteredConcerts.length} concerts`;
  }
  
  // Update results summary
  function updateResultsSummary() {
    if (filteredConcerts.length > 0) {
      resultsSummary.style.display = 'flex';
      resultsCount.textContent = `${filteredConcerts.length} concert${filteredConcerts.length !== 1 ? 's' : ''} found`;
      
      if (itemsPerPage > 0 && filteredConcerts.length > itemsPerPage) {
        const totalPages = Math.ceil(filteredConcerts.length / itemsPerPage);
        if (paginationType === 'pagination') {
          pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        } else {
          const showing = Math.min(showMoreIndex + itemsPerPage, filteredConcerts.length);
          pageInfo.textContent = `Showing ${showing} of ${filteredConcerts.length}`;
        }
      } else {
        pageInfo.textContent = '';
      }
    } else {
      resultsSummary.style.display = 'none';
    }
  }
  
  // Clear all filters
  function clearAllFilters() {
    searchInput.value = '';
    dateFilter.value = '';
    currentPage = 1;
    showMoreIndex = 0;
    filterConcerts();
    searchInput.focus();
  }
  
  // Event listeners
  if (searchInput) {
    searchInput.addEventListener('input', filterConcerts);
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        clearAllFilters();
      }
    });
  }
  
  if (dateFilter) {
    dateFilter.addEventListener('change', filterConcerts);
  }
  
  if (clearDateBtn) {
    clearDateBtn.addEventListener('click', function() {
      dateFilter.value = '';
      filterConcerts();
    });
  }
  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearAllFilters);
  }
  
  // Show more button
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', function() {
      showMoreIndex += itemsPerPage;
      updateDisplay();
      
      // Smooth scroll to new content
      setTimeout(() => {
        const newCards = document.querySelectorAll('.concert-card[style*="opacity: 1"]');
        if (newCards.length > showMoreIndex - itemsPerPage) {
          newCards[showMoreIndex - itemsPerPage].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 300);
    });
  }
  
  // Pagination clicks
  if (paginationList) {
    paginationList.addEventListener('click', function(e) {
      e.preventDefault();
      const target = e.target.closest('a');
      if (target && target.dataset.page) {
        const newPage = parseInt(target.dataset.page);
        if (newPage >= 1 && newPage <= Math.ceil(filteredConcerts.length / itemsPerPage)) {
          currentPage = newPage;
          updateDisplay();
          
          // Scroll to top of concerts
          concertsContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  }
  
  // Items per page dropdown
  if (itemsPerPageDropdown) {
    document.querySelectorAll('#itemsPerPageDropdown + .dropdown-menu .dropdown-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        const newValue = parseInt(this.dataset.value);
        itemsPerPage = newValue;
        currentPerPageSpan.textContent = newValue === 0 ? 'All' : newValue;
        
        // Switch between pagination types based on items per page
        if (newValue <= 12 && newValue > 0) {
          paginationType = 'showmore';
        } else {
          paginationType = 'pagination';
        }
        
        currentPage = 1;
        showMoreIndex = 0;
        updateDisplay();
      });
    });
  }
  
  // Initialize
  filterConcerts();
  
  // Update booking count (you can call this from your booking system)
  function updateBookingCount(count) {
    const bookingBadge = document.getElementById('booking-count');
    if (count > 0) {
      bookingBadge.textContent = count;
      bookingBadge.style.display = 'inline-flex';
    } else {
      bookingBadge.style.display = 'none';
    }
  }
  
  // Example: Load booking count from localStorage or API
  const savedBookings = localStorage.getItem('userBookings');
  if (savedBookings) {
    try {
      const bookings = JSON.parse(savedBookings);
      updateBookingCount(bookings.length);
    } catch (e) {
      console.log('Error loading booking count');
    }
  }
  
  // Make updateBookingCount globally available
  window.updateBookingCount = updateBookingCount;
  
  // Toggle between pagination types (you can add a button for this)
  window.togglePaginationType = function() {
    paginationType = paginationType === 'pagination' ? 'showmore' : 'pagination';
    currentPage = 1;
    showMoreIndex = 0;
    updateDisplay();
  };
});