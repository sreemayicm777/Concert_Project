const mongoose = require('mongoose');
const Concert = require('../models/Concert');

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
    const { name, date, time, venue, ticketPrice, availableTickets } = req.body;
    
    // Handle image upload
    const imagePath = req.file 
      ? '/uploads/' + req.file.filename 
      : '/images/default-concert.jpg';

    const newConcert = await Concert.create({
      name,
      date,
      time,
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
    const { name, date, time, venue, ticketPrice, availableTickets } = req.body;
    const updateData = {
      name,
      date,
      time,
      venue,
      ticketPrice,
      availableTickets
    };

    if (req.file) {
      updateData.image = 'public/uploads/' + req.file.filename;
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