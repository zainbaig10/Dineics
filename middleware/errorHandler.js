export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.error({
    message: err.message,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    msg: err.message || "Internal Server Error",
  });
};
