const express = require('express')
const router = express.Router()
const isSignedIn = require('../middleware/is-signed-in')
const Listing = require('../models/listing')
/* NEW LISTING FORM
router.get('/new', (req, res) => {
  res.send('The /new route is working!')
})*/

// NEW LISTING FORM
router.get('/new', isSignedIn, (req, res) => {
  res.render('listings/new.ejs')
})

// POST FORM DATA TO DATABASE
router.post('/', isSignedIn, async (req, res) => {
  try {
    req.body.seller = req.session.user._id
    await Listing.create(req.body)
    res.redirect('/listings')
  } catch (error) {
    console.log(error)
    res.send('Something went wrong')
  }
})

// VIEW ALL LISTINGS
router.get('/', async (req, res) => {
  try {
    const foundListings = await Listing.find()
    res.render('listings/index.ejs', { foundListings: foundListings })
  } catch (err) {
    console.log(err)
    res.send('Something went wrong')
  }
})

module.exports = router