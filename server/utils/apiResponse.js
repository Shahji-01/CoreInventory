exports.success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data: data,
  });
};

exports.error = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message: message,
  });
};
