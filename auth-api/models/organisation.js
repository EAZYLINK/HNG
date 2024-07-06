'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Organisation extends Model {
    static associate(models) {
      Organisation.belongsToMany(models.User, {
        through: 'UserOrganization'
      })
    }
  }
  Organisation.init({
    orgId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Organisation',
  });
  return Organisation;
};