import mongoose from 'mongoose';

// Content of a page edited in the CMS. "content" follows the page definition
// (data/pages.js) and is only saved after validation (utils/content.js).
// A page never edited has no document: the site then shows the default texts.
const pageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
    },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.model('Page', pageSchema);
