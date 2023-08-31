const { Profile, User } = require('../models');

class UserController {
  static home(req, res) {
    res.render('home');
  }

  static registerForm(req, res) {
    res.render('register');
  }

  static register(req, res) {
    const { email, password, fullName, age, phone, country } = req.body;

    User.findOne({ where: { email: email } })
      .then((user) => {
        if (user) {
          // Email sudah ada dalam database
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
        res.redirect('/login');
      })
      .catch((err) => {
        res.send(err.message); // Menampilkan pesan kesalahan dari Error yang dilempar
      });
  }

  static loginForm(req, res) {
    res.render('home');
  }

  static login(req, res) {
    const { email, password } = req.body;

    User.findByEmail(email)
      .then((user) => {
        if (!user) {
          res.send('User tidak ditemukan.');
          return;
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
            res.send(
              'Terlalu banyak upaya login dengan user ini, coba lagi dalam 5 menit.'
            );
          } else {
            res.send('Email atau kata sandi salah.');
          }
        }
      })
      .catch((err) => {
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
      res.redirect('/login');
    });
  }
}

module.exports = UserController;
