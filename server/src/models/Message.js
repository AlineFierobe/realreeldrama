import mongoose from 'mongoose';

// Message sent from the site's Contact page, read in CMS › Messages
const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Your name is required.'], trim: true, maxlength: 120 },
    email: {
      type: String,
      required: [true, 'Your email is required.'],
      trim: true,
      lowercase: true,
      maxlength: 200,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'],
    },
    topic: { type: String, trim: true, maxlength: 120, default: '' },
    message: { type: String, required: [true, 'Your message is required.'], trim: true, maxlength: 5000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
