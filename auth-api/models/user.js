'use strict';
const {  Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsToMany(models.Organisation, {
        through: 'UserOrganizations'
      })
    }
  }
  User.init({
    userId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type:DataTypes.STRING,
      allowNull: false
    },
    email: {
      type:DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};