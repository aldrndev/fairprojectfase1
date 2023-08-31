function isAuthenticated(req, res, next) {
  if (!req.session || !req.session.user) {
    res.redirect('/login');
    req.isAuthenticated = false;
  } else {
    req.isAuthenticated = true;
    next(); // Lanjutkan ke middleware atau route handler selanjutnya
  }
}

module.exports = isAuthenticated;
