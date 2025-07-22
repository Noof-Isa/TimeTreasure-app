const express = require('express')
const router = express.Router()
const isSignedIn = require('../middleware/is-signed-in')
const Listing = require('../models/listing')
const upload = require('../config/multer')
const cloudinary = require('../config/cloudinary')
/* NEW LISTING FORM
router.get('/new', (req, res) => {
  res.send('The /new route is working!')
})*/

// NEW LISTING FORM
router.get('/new', isSignedIn, (req, res) => {
  res.render('listings/new.ejs')
})

// POST FORM DATA TO DATABASE
router.post('/', isSignedIn, upload.single('image'), async (req, res) => {
  try {
    req.body.seller = req.session.user._id
    req.body.image = {
      url: req.file.path,
      cloudinary_id: req.file.filename
    }
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

// VIEW A SINGLE LISTING
router.get('/:listingId', async (req, res) => {
  try {
    const foundListing = await Listing.findById(req.params.listingId)
  .populate('seller')
  .populate('comments.author')
    res.render('listings/show.ejs', { foundListing })
  } catch (error) {
    console.log(error)
    res.redirect('/listings')
  }
})

// DELETE LISTING FROM DATABASE
router.delete('/:listingId', isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId).populate('seller')

  if (foundListing.seller._id.equals(req.session.user._id)) {
    await foundListing.deleteOne()
    return res.redirect('/listings')
  }

  return res.send('Not authorized')
})

// RENDER THE EDIT FORM VIEW
router.get('/:listingId/edit', isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId).populate('seller')

  if (foundListing.seller._id.equals(req.session.user._id)) {
    return res.render('listings/edit.ejs', { foundListing: foundListing })
  }

  return res.send('Not authorized')
})

// HANDLE EDIT FORM SUBMISSION
router.put('/:listingId', isSignedIn, upload.single('image') ,async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId).populate('seller')
  // Check if the logged-in user is the listing owner

  if (foundListing.seller._id.equals(req.session.user._id)) {
        // If a new image was uploaded, delete the old one from Cloudinary
            if (req.file && foundListing.image?.cloudinary_id) {
await cloudinary.uploader.destroy(foundListing.image.cloudinary_id)
      foundListing.image.url = req.file.path
      foundListing.image.cloudinary_id = req.file.filename
    }
   // Update listing fields
    foundListing.title = req.body.title
    foundListing.description = req.body.description
    foundListing.price = req.body.price

    await foundListing.save()
        return res.redirect(`/listings/${req.params.listingId}`)
  }
  return res.send('Not authorized')
})

// POST COMMENT FORM TO THE DATABASE
router.post('/:listingId/comments', isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId)
  req.body.author = req.session.user._id
  foundListing.comments.push(req.body)
  await foundListing.save()
  res.redirect(`/listings/${req.params.listingId}`)
})


module.exports = router