const { validationResult } = require('express-validator');

/**
 * Runs after express-validator rules.
 * Returns a consistent 400 response for invalid input.
 */
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    message: 'Validation failed',
    errors: errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    })),
  });
};

