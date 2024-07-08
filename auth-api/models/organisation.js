'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Organisation extends Model {
    static associate(models) {
      Organisation.belongsToMany(models.User, {
        through: 'UserOrganisation'
      })
    }
  }
  Organisation.init({
    orgId: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Organisation',
  });
  return Organisation;
};