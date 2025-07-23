const express = require('express')
const router = express.Router()
const isSignedIn = require('../middleware/is-signed-in')
const Listing = require('../models/listing')
const upload = require('../config/multer')

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
// MY LISTINGS (ONLY SHOW LISTINGS CREATED BY CURRENT USER)
router.get('/my', isSignedIn, async (req, res) => {
  try {
    const myListings = await Listing.find({ seller: req.session.user._id })
    res.render('listings/myListings.ejs', { listings: myListings })
  } catch (error) {
    console.log(error)
    res.redirect('/listings')
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
router.put('/:listingId', isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId).populate('seller')

  if (foundListing.seller._id.equals(req.session.user._id)) {
    await Listing.findByIdAndUpdate(req.params.listingId, req.body, { new: true })
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

router.put('/:listingId/comments/:commentId', isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId)
  const comment = foundListing.comments.id(req.params.commentId)

  if (comment.author.equals(req.session.user._id)) {
    comment.content = req.body.content
    await foundListing.save()
    res.redirect(`/listings/${req.params.listingId}`)
  } else {
    res.send('Not authorized')
  }
})



module.exports = router