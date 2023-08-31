const { Post, Profile, Tag, User } = require('../models');
const formatDate = require('../helpers/formatDate');

class DataController {
  static showPost(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }
    let currentUser;
    User.findOne({
      where: { id: req.session.user.id },
      include: Profile,
    })
      .then((user) => {
        currentUser = user;
        return Post.findAll({
          include: [
            {
              model: User,
              include: Profile,
            },
          ],
        });
      })
      .then((posts) => {
        res.render('showPosts', { posts, user: currentUser });
      })
      .catch((err) => {
        res.send(err);
      });
  }

  static addPostForm(req, res) {
    Tag.findAll()
      .then((tags) => {
        res.render('addPost', { tags });
      })
      .catch((err) => {
        res.send(err);
      });
  }

  static addPost(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }

    const { title, content, imgUrl, tags } = req.body;
    const userId = req.session.user.id;

    Post.create({
      title,
      content,
      imgUrl,
      UserId: userId,
    })
      .then((newPost) => {
        return newPost.addTags(tags); // tags adalah array dari ID tag yang dipilih
      })
      .then(() => {
        res.redirect('/posts');
      })
      .catch((err) => {
        res.send(err);
      });
  }

  static showTags(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }

    Tag.findAll()
      .then((tags) => {
        res.render('showTags', { tags, userRole: req.session.user.role });
      })
      .catch((err) => {
        res.send('Terjadi kesalahan saat mencoba mengambil data tags.');
      });
  }

  static addTagForm(req, res) {
    res.render('addTag');
  }

  static addTag(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }
    const { name } = req.body;

    Tag.create({ name })
      .then(() => {
        res.redirect('/tags'); // Setelah tag berhasil ditambahkan, redirect ke halaman daftar tag
      })
      .catch((err) => {
        res.send('Terjadi kesalahan saat mencoba menambahkan tag baru.');
      });
  }

  static editPostForm(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }
    const postId = req.params.id;
    const loggedInUserId = req.session.user.id; // ID pengguna yang saat ini logged in

    let currentPost;

    Post.findByPk(postId, {
      include: Tag,
    })
      .then((post) => {
        if (
          post.UserId !== loggedInUserId &&
          req.session.user.role !== 'admin'
        ) {
          throw new Error('Unauthorized'); // Jika pengguna tidak memiliki hak, lemparkan error
        }
        currentPost = post;
        return Tag.findAll(); // Ambil semua tags dari database
      })
      .then((tags) => {
        // Render template dengan post dan tags
        res.render('editPost', { post: currentPost, tags });
      })
      .catch((err) => {
        if (err.message === 'Unauthorized') {
          res.send('Anda tidak memiliki hak untuk mengedit postingan ini.');
        } else {
          res.send('Terjadi kesalahan saat memproses permintaan Anda.');
        }
      });
  }

  static editPost(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }
    const postId = req.params.id;
    const loggedInUserId = req.session.user.id;

    const { title, content, imgUrl, tags } = req.body; // Assumed that tags contains the selected tag IDs.

    Post.findByPk(postId)
      .then((post) => {
        if (
          post.UserId !== loggedInUserId &&
          req.session.user.role !== 'admin'
        ) {
          throw new Error('Unauthorized'); // Jika pengguna tidak memiliki hak, lemparkan error
        }
        return post.update({
          title,
          content,
          imgUrl,
          // Anda dapat menambahkan field lain yang Anda ingin perbarui
        });
      })
      .then((updatedPost) => {
        // Now, set the tags based on the form's selection
        return updatedPost.setTags(tags); // This will update the PostTags table
      })
      .then(() => {
        res.redirect(`/posts/${postId}/detail`); // Anda dapat mengalihkan ke halaman tampilan post atau ke mana pun yang Anda inginkan
      })
      .catch((err) => {
        if (err.message === 'Unauthorized') {
          res.send('Anda tidak memiliki hak untuk mengedit postingan ini.');
        } else {
          res.send('Terjadi kesalahan saat memproses permintaan Anda.');
        }
      });
  }

  static showPostDetail(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }
    const postId = req.params.id;

    Post.findByPk(postId, {
      include: [{ model: User, include: [Profile] }, { model: Tag }],
    })
      .then((post) => {
        res.render('showPostDetail', {
          post,
          formatDate,
          currentUser: req.session.user,
        });
      })
      .catch((err) => {
        res.send(err);
      });
  }

  static deletePost(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }
    const postId = req.params.id;
    const loggedInUserId = req.session.user.id;
    const loggedInUserRole = req.session.user.role; // pastikan role pengguna ada dalam session saat login

    // Jika pengguna memiliki role admin, maka langsung hapus post
    if (loggedInUserRole === 'admin') {
      Post.destroy({ where: { id: postId } })
        .then(() => {
          res.redirect('/posts');
        })
        .catch((err) => {
          res.send('Terjadi kesalahan saat memproses permintaan Anda.');
        });
    } else {
      // Jika bukan admin, pastikan bahwa post memang milik pengguna yang sedang masuk
      Post.findByPk(postId)
        .then((post) => {
          if (post && post.UserId === loggedInUserId) {
            return post.destroy();
          } else {
            res.send('Anda tidak memiliki hak untuk menghapus postingan ini.');
            return null; // Ini mengembalikan promise yang sudah diselesaikan
          }
        })
        .then(() => {
          res.redirect('/posts');
        })
        .catch((err) => {
          res.send('Terjadi kesalahan saat memproses permintaan Anda.');
        });
    }
  }

  static editTagForm(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }
    if (req.session.user && req.session.user.role === 'admin') {
      // Implementasi form edit untuk tag
      Tag.findByPk(req.params.id)
        .then((tag) => {
          res.render('editTag', { tag });
        })
        .catch((err) => {
          res.send(err);
        });
    } else {
      res.send('Hanya admin yang dapat mengakses fitur ini.');
    }
  }

  static editTag(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }
    if (req.session.user && req.session.user.role === 'admin') {
      // Implementasi logika untuk mengedit tag
      const { name } = req.body;
      Tag.update(
        { name },
        {
          where: { id: req.params.id },
        }
      )
        .then(() => {
          res.redirect('/tags');
        })
        .catch((err) => {
          res.send(err);
        });
    } else {
      res.send('Hanya admin yang dapat mengakses fitur ini.');
    }
  }

  static deleteTag(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }
    const { id } = req.params;
    if (req.session.user && req.session.user.role === 'admin') {
      Tag.destroy({
        where: {
          id,
        },
      })
        .then(() => {
          res.redirect('/tags');
        })
        .catch((err) => {
          res.send(err);
        });
    } else {
      res.send('Anda tidak memiliki izin untuk melakukan ini.');
    }
  }

  static profile(req, res) {
    if (!req.isAuthenticated) {
      return res.redirect('/login');
    }

    const userId = req.session.user.id;

    User.findByPk(userId, {
      include: Profile,
    })
      .then((user) => {
        res.render('profile', { profile: user, formatDate }); // 'profile' adalah nama file ejs Anda
      })
      .catch((err) => {
        res.send('Terjadi kesalahan saat memproses permintaan Anda.');
      });
  }
}

module.exports = DataController;
