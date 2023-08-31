'use strict';
const bcrypt = require('bcryptjs');

const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Post, { foreignKey: 'UserId' });
      User.belongsTo(models.Profile, { foreignKey: 'ProfileId' });
    }

    //static method
    static findByEmail(email) {
      return this.findOne({ where: { email } });
    }

    // Instance method untuk memeriksa kecocokan password
    checkPassword(inputPassword) {
      return bcrypt.compareSync(inputPassword, this.password);
    }
  }
  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: 'Email cant empty',
          },
          notNull: {
            msg: 'Email cant empty',
          },
          isEmail: {
            msg: 'Format email is invalid',
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Password cant empty',
          },
          notNull: {
            msg: 'Password cant empty',
          },
          len: {
            args: [8],
            msg: 'Password must be at least 8 characters',
          },
        },
      },
      role: DataTypes.STRING,
      ProfileId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'User',
      hooks: {
        //hook
        beforeCreate: (user, option) => {
          if (
            user.email === 'admin@gmail.com' ||
            user.email === 'manager@gmail.com' ||
            user.email === 'moderator@gmail.com'
          ) {
            user.role = 'admin';
          } else {
            user.role = 'user';
          }
        },
        beforeSave: (user, option) => {
          if (user.changed('password')) {
            user.password = bcrypt.hashSync(user.password, 10);
          }
        },
      },
    }
  );
  return User;
};
