const { Post, Profile, Tag, User } = require('../models');
const formatDate = require('../helpers/formatDate');
const { Op } = require('sequelize');

class DataController {
  static showPost(req, res) {
    let currentUser;
    let searchQuery = req.query.query;

    User.findOne({
      where: { id: req.session.user.id },
      include: Profile,
    })
      .then((user) => {
        currentUser = user;

        if (searchQuery) {
          return Post.findAll({
            where: {
              title: {
                [Op.iLike]: `%${searchQuery}%`,
              },
            },
            include: [
              {
                model: User,
                include: Profile,
              },
            ],
          });
        } else {
          return Post.findAll({
            include: [
              {
                model: User,
                include: Profile,
              },
            ],
          });
        }
      })
      .then((posts) => {
        res.render('showPosts', { posts, user: currentUser });
      })
      .catch((err) => {
        res.send(err);
      });
  }

  static addPostForm(req, res) {
    const { error } = req.query;

    Tag.findAll()
      .then((tags) => {
        res.render('addPost', { tags, error });
      })
      .catch((err) => {
        res.send(err);
      });
  }

  static addPost(req, res) {
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
        if ((err.name = 'SequelizeValidationErrors'))
          return res.redirect(`/posts/add?error=${err.message}`);
        res.send(err);
      });
  }

  static showTags(req, res) {
    Tag.findAll()
      .then((tags) => {
        res.render('showTags', { tags, userRole: req.session.user.role });
      })
      .catch((err) => {
        res.send('Terjadi kesalahan saat mencoba mengambil data tags.');
      });
  }

  static addTagForm(req, res) {
    const { error } = req.query;
    res.render('addTag', { error });
  }

  static addTag(req, res) {
    const { name } = req.body;

    Tag.create({ name })
      .then(() => {
        res.redirect('/tags'); // Setelah tag berhasil ditambahkan, redirect ke halaman daftar tag
      })
      .catch((err) => {
        if ((err.name = 'SequelizeValidationErrors'))
          return res.redirect(`/tags/add?error=${err.message}`);
        res.send(err);
      });
  }

  static editPostForm(req, res) {
    const postId = req.params.id;
    const loggedInUserId = req.session.user.id; // ID pengguna yang saat ini logged in
    const { error } = req.query;
    let currentPost;

    Post.findByPk(postId, {
      include: Tag,
    })
      .then((post) => {
        if (
          post.UserId !== loggedInUserId &&
          req.session.user.role !== 'admin'
        ) {
          throw new Error('Unauthorized'); // Jika pengguna tidak memiliki hak
        }
        currentPost = post;
        return Tag.findAll(); // Ambil semua tags dari database
      })
      .then((tags) => {
        res.render('editPost', { post: currentPost, tags, error });
      })
      .catch((err) => {
        if (err.message === 'Unauthorized')
          return res.redirect(
            `/post/${postId}/edit?error='Tidak memiliki hak untuk mengedit post ini'`
          );

        if ((err.name = 'SequelizeValidationErrors'))
          return res.redirect(`/tags/add?error=${err.message}`);

        res.send(err);
      });
  }

  static editPost(req, res) {
    const postId = req.params.id;
    const loggedInUserId = req.session.user.id;

    const { title, content, imgUrl, tags } = req.body;

    Post.findByPk(postId)
      .then((post) => {
        if (
          post.UserId !== loggedInUserId &&
          req.session.user.role !== 'admin'
        ) {
          throw new Error('Unauthorized'); // Jika pengguna tidak memiliki hak
        }
        return post.update({
          title,
          content,
          imgUrl,
        });
      })
      .then((updatedPost) => {
        return updatedPost.setTags(tags);
      })
      .then(() => {
        res.redirect(`/posts/${postId}/detail`);
      })
      .catch((err) => {
        if (err.message === 'Unauthorized')
          return res.redirect(
            `/post/${currentPost.id}/edit?error='Tidak memiliki hak untuk mengedit post ini'`
          );
        if ((err.name = 'SequelizeValidationErrors'))
          return res.redirect(`/tags/add?error=${err.message}`);
        res.send(err);
      });
  }

  static showPostDetail(req, res) {
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
          res.send(err);
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
          res.send(err);
        });
    }
  }

  static editTagForm(req, res) {
    if (req.session.user && req.session.user.role === 'admin') {
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
    if (req.session.user && req.session.user.role === 'admin') {
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
    const userId = req.session.user.id;

    User.findByPk(userId, {
      include: Profile,
    })
      .then((user) => {
        res.render('profile', { profile: user, formatDate });
      })
      .catch((err) => {
        res.send('Terjadi kesalahan saat memproses permintaan Anda.');
      });
  }
}

module.exports = DataController;
