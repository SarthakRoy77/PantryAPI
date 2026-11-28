function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Please log in to access this route' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You need to be an admin to access this route' });
  }
  return next();
}

export default requireAdmin;
