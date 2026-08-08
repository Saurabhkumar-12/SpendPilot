export function validateRequest(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;
      next();
    } catch (error) {
      if (error.errors) {
        const issues = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return res.status(400).json({ success: false, error: `Validation Error: ${issues}` });
      }
      return res.status(400).json({ success: false, error: 'Invalid request data format.' });
    }
  };
}
