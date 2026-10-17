import mongoose from 'mongoose';

// Image uploaded from the CMS (photos, show artwork…). The file is stored in MongoDB itself:
// nothing is lost when the host redeploys the app, and backups cover the images too.
// Served publicly by GET /api/media/:id (routes/public.js).
const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, trim: true, maxlength: 200, default: 'image' },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    uploadedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Media', mediaSchema);
