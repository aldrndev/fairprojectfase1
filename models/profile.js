'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Profile.hasOne(models.User, { foreignKey: 'ProfileId' });
    }
  }
  Profile.init(
    {
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Full Name cant empty',
          },
          notNull: {
            msg: 'Full Name cant empty',
          },
        },
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Age cant empty',
          },
          notNull: {
            msg: 'Age cant empty',
          },
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Phone cant empty',
          },
          notNull: {
            msg: 'Phone cant empty',
          },
        },
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Country cant empty',
          },
          notNull: {
            msg: 'Country cant empty',
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'Profile',
    }
  );
  return Profile;
};
