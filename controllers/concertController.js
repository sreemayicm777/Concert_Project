const mongoose = require('mongoose');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const Concert = require('../models/Concert');
const Booking = require('../models/Booking');

// Get all concerts
exports.getAllConcerts = async (req, res) => {
  try {
    const concerts = await Concert.find().sort({ date: 1 });
    res.render('concerts/index', { concerts });
  } catch (err) {
    res.render('error', { error: err.message });
  }
};

// Show form to create new concert
exports.getNewForm = (req, res) => {
  res.render('concerts/new');
};

// Create new concert with image upload
exports.createConcert = async (req, res) => {
  try {
    const { name, date, time,timePeriod, venue, ticketPrice, availableTickets } = req.body;
    // Validate date is not in the past
    const concertDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (concertDate < today) {
      req.flash('error', 'Concert date cannot be in the past');
      return res.redirect('/concerts/new');
    }

    // Format time with AM/PM
    let formattedTime = time;
    if (timePeriod) {
      const [hours, minutes] = time.split(':');
      if (timePeriod === 'PM' && parseInt(hours) < 12) {
        formattedTime = `${parseInt(hours) + 12}:${minutes}`;
      } else if (timePeriod === 'AM' && hours === '12') {
        formattedTime = `00:${minutes}`;
      }
    }
    // Handle image upload
    const imagePath = req.file 
      ? '/uploads/' + req.file.filename 
      : '/images/default-concert.jpg';

    const newConcert = await Concert.create({
      name,
      date,
      time:formattedTime, // Store in 24-hour format
      venue,
      ticketPrice,
      availableTickets,
      image: imagePath
    });

    res.redirect(`/concerts/${newConcert._id}`);
  } catch (err) {
    res.render('error', { error: err.message });
  }
};
// Get single concert
exports.getConcert = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      req.flash('error', 'Invalid concert ID');
      return res.redirect('/concerts');
    }

    const concert = await Concert.findById(req.params.id);
    if (!concert) {
      req.flash('error', 'Concert not found');
      return res.redirect('/concerts');
    }
    res.render('concerts/show', { concert });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/concerts');
  }
};

// Show edit form
exports.getEditForm = async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.id);
    if (!concert) {
      req.flash('error', 'Concert not found');
      return res.redirect('/concerts');
    }
    res.render('concerts/edit', { concert });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/concerts');
  }
};

// Update concert with image upload
exports.updateConcert = async (req, res) => {
  try {
    const { name, date, time,timePeriod, venue, ticketPrice, availableTickets ,existingImage } = req.body;

      // Format time with AM/PM
    let formattedTime = time;
    if (timePeriod) {
      const [hours, minutes] = time.split(':');
      if (timePeriod === 'PM' && parseInt(hours) < 12) {
        formattedTime = `${parseInt(hours) + 12}:${minutes}`;
      } else if (timePeriod === 'AM' && hours === '12') {
        formattedTime = `00:${minutes}`;
      }
    }
    const updateData = {
      name,
      date,
      time:formattedTime,
      venue,
      ticketPrice,
      availableTickets,
       image: existingImage || '/images/default-concert.jpg' // Default if no image exists    
    };

   // Handle image upload with resizing
    if (req.file) {
      const uploadsDir = path.join(__dirname, '../public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `concert-${Date.now()}${path.extname(req.file.originalname)}`;
      const outputPath = path.join(uploadsDir, filename);

      // Resize and save image (600x400 pixels)
      await sharp(req.file.path)
        .resize(600, 400, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      // Delete the original temp file
      fs.unlinkSync(req.file.path);

      updateData.image = '/uploads/' + filename; // Store relative path
    }

    const updatedConcert = await Concert.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    req.flash('success', 'Concert updated successfully!');
    res.redirect(`/concerts/${updatedConcert._id}`);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect(`/concerts/${req.params.id}/edit`);
  }
};

// Delete concert
exports.deleteConcert = async (req, res) => {
  try {
    const deletedConcert = await Concert.findByIdAndDelete(req.params.id);
    if (!deletedConcert) {
      req.flash('error', 'Concert not found');
      return res.redirect('/concerts');
    }
    req.flash('success', 'Concert deleted successfully!');
    res.redirect('/concerts');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/concerts');
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    // Get all bookings with non-deleted concerts
    const bookings = await Booking.find({
      'concert': { $exists: true, $ne: null } // Ensure concert exists
    })
    .populate({
      path: 'concert',
      match: { status: { $ne: 'deleted' } } // Only populate non-deleted concerts
    })
    .populate('user','username email');

    // Filter out bookings with null concert (deleted concerts)
    const validBookings = bookings.filter(booking => booking.concert !== null);
    
    // Format bookings and separate active/cancelled
    const formattedBookings = validBookings.map(booking => {
      const concert = booking.concert || {};
      const user = booking.user || {};
      
      return {
        ...booking.toObject(),
        user: {
          name: user.name || 'Unknown User',
          email: user.email || 'No email'
        },
        formattedBookingDate: booking.createdAt.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        concert: {
          id: concert._id || null,
          name: concert.name || 'Deleted Concert',
          date: concert.date,
          time: concert.time,
          venue: concert.venue,
          ticketPrice: concert.ticketPrice || 0,
          availableTickets: concert.availableTickets || 0,
          image: concert.image || '/images/default-concert.jpg'
        },
        formattedConcertDate: concert.date 
          ? concert.date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : 'Date not available'
      };
    });

    // Separate active and cancelled bookings
    const activeBookings = formattedBookings.filter(b => b.status !== 'cancelled');
    const cancelledBookings = formattedBookings.filter(b => b.status === 'cancelled');

    res.render('concerts/get-all-bookings', {
      title: 'All Bookings',
      bookings: activeBookings, // Only show active by default
      cancelledBookings: cancelledBookings,
      helpers: {
        paymentBadge: (status) => {
          const statusClass = status === 'paid' ? 'success' : status === 'pending' ? 'warning' : 'danger';
          return `<span class="badge bg-${statusClass}">${status}</span>`;
        },
        statusBadge: (status) => {
          const statusClass = status === 'confirmed' ? 'success' : status === 'pending' ? 'warning' : 'danger';
          return `<span class="badge bg-${statusClass}">${status}</span>`;
        }
      }
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).render('error', { 
      message: 'Failed to load bookings',
      error: err 
    });
  }
};

// Add this new controller for deleting bookings
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    await Booking.findByIdAndDelete(id);
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
};