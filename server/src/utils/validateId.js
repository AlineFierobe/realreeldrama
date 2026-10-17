import mongoose from 'mongoose';

// Middleware: checks that the given URL parameters look like MongoDB ids
// before querying the database. E.g. validateIds('id')
export const validateIds =
  (...names) =>
  (req, res, next) => {
    const invalid = names.some((name) => !mongoose.isValidObjectId(req.params[name]));
    if (invalid) return res.status(400).json({ error: 'Invalid ID.' });
    next();
  };
