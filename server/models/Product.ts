import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    id: String,
    userId: String,
    userName: String,
    rating: Number,
    comment: String,
    createdAt: String,
    helpful: Number
});

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: [String],
    videoUrl: String,
    category: { type: String, required: true },
    tags: [String],
    stock: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    reviews: [reviewSchema],
    createdAt: { type: String, default: () => new Date().toISOString() },
    seller: {
        id: String,
        name: String,
        avatar: String
    }
}, {
    toJSON: {
        transform: function(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

export const Product = mongoose.model('Product', productSchema); 