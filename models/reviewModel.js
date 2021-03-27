/* eslint-disable prefer-arrow-callback */
// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now, //!! Not sure if calling
      select: false,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// prevent duplicate reviews by having the tour and user be unique in the model
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// static - retains the value on the object
//        - in order to call the aggregate function
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // returns an array of object
  const stats = await this.aggregate([
    // this refers to the model
    {
      $match: { tour: tourId },
    },
    {
      // group all tours together by tour
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 }, // increment by 1
        avgRating: { $avg: '$rating' }, // avg the rating field
      },
    },
  ]);
  console.log('stats', stats);

  // save the statistics to the current tour
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // reset to default if there are no more reviews
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour);
});

// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   this.r = await this.findOne();
//   console.log(this.r);
//   next();
// });

reviewSchema.post(/^findOneAnd/, async function (doc) {
  // await this.findOne(); // does not work here, the query has already executed
  if (doc) await doc.constructor.calcAverageRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
