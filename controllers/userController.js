const { Profile, User } = require('../models');

class UserController {
  static registerForm(req, res) {
    const { error } = req.query;
    res.render('register', { error });
  }

  static register(req, res) {
    const { email, password, fullName, age, phone, country } = req.body;

    User.findOne({ where: { email: email } })
      .then((user) => {
        if (user) {
          throw new Error('Email already registered');
        }
        return Profile.create({
          fullName,
          age,
          phone,
          country,
        });
      })
      .then((profile) => {
        return User.create({
          email,
          password,
          ProfileId: profile.id,
        });
      })
      .then(() => {
        res.redirect('/');
      })
      .catch((err) => {
        const error = 'Email already registered';
        if (err.message === error)
          return res.redirect(`/register?error=${error}`);
        if ((err.name = 'SequelizeValidationErrors'))
          return res.redirect(`/register?error=${err.message}`);
        res.send(err); // Menampilkan pesan kesalahan dari Error yang dilempar
      });
  }

  static loginForm(req, res) {
    const { error } = req.query;

    res.render('home', { error });
  }

  static login(req, res) {
    const { email, password } = req.body;

    User.findByEmail(email)
      .then((user) => {
        if (!user) {
          throw new Error('Email tidak ditemukan.');
        }
        // Jika user ditemukan, verifikasi password
        if (user.checkPassword(password)) {
          // Jika password benar, reset hitungan kesalahan dan masukkan user ke dalam sesi
          req.session.errorCount = 0;
          req.session.user = {
            id: user.id,
            email: user.email,
            role: user.role, // Pastikan model Anda memiliki kolom 'role'
          };
          res.redirect('/posts');
        } else {
          // Jika password salah, tambah hitungan kesalahan
          req.session.errorCount += 1;

          // Berdasarkan hitungan kesalahan, tampilkan pesan yang sesuai
          if (req.session.errorCount >= 3) {
            throw new Error(
              'Terlalu banyak upaya login dengan user ini, coba lagi dalam 5 menit.'
            );
          } else {
            throw new Error('Email atau kata sandi salah.');
          }
        }
      })
      .catch((err) => {
        const errorEmail = 'Email tidak ditemukan.';
        const errorLimit =
          'Terlalu banyak upaya login dengan user ini, coba lagi dalam 5 menit.';
        const errorValidate = 'Email atau kata sandi salah.';
        if (err.message === errorEmail)
          return res.redirect(`/?error=${errorEmail}`);
        if (err.message === errorLimit)
          return res.redirect(`/?error=${errorLimit}`);
        if (err.message === errorValidate)
          return res.redirect(`/?error=${errorValidate}`);

        if ((err.name = 'SequelizeValidationErrors'))
          return res.redirect(`/?error=${err.message}`);

        res.send(err);
      });
  }

  static logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        // Tangani error saat menghancurkan sesi
        res.send('Terjadi kesalahan saat logout');
        return;
      }

      // Arahkan pengguna ke halaman login atau awal
      res.redirect('/');
    });
  }
}

module.exports = UserController;
