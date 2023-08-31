const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const isAuthenticated = require('../helpers/auth');
const UserController = require('../controllers/userController');
const DataController = require('../controllers/dataController');

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 menit
  max: 3, // batasi setiap user ke 3 permintaan per windowMs
  message:
    'Terlalu banyak upaya login dengan user ini, coba lagi dalam 5 menit.',
  keyGenerator: function (req, res) {
    return req.body.email; // atau gunakan `username` atau field lainnya
  },
});

router.get('/', UserController.home);

router.get('/register', UserController.registerForm);
router.post('/register', UserController.register);

router.get('/login', UserController.loginForm);
router.post('/login', loginLimiter, UserController.login);

router.get('/logout', UserController.logout);

router.get('/posts', isAuthenticated, DataController.showPost);

router.get('/posts/add', isAuthenticated, DataController.addPostForm);
router.post('/posts/add', isAuthenticated, DataController.addPost);

router.get('/tags', isAuthenticated, DataController.showTags);

router.get('/tags/add', isAuthenticated, DataController.addTagForm);
router.post('/tags/add', isAuthenticated, DataController.addTag);

router.get('/posts/:id/detail', isAuthenticated, DataController.showPostDetail);

router.get('/posts/:id/edit', isAuthenticated, DataController.editPostForm);
router.post('/posts/:id/edit', isAuthenticated, DataController.editPost);

router.get('/posts/:id/delete', isAuthenticated, DataController.deletePost);

router.get('/tags/:id/edit', isAuthenticated, DataController.editTagForm);
router.post('/tags/:id/edit', isAuthenticated, DataController.editTag);

router.get('/tags/:id/delete', isAuthenticated, DataController.deleteTag);

router.get('/profile', isAuthenticated, DataController.profile);

module.exports = router;
