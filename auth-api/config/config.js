require('dotenv').config()

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL_DEV',
    dialect: "postgres",
    ssl: {
      rejectUnauthorized: false,
    },
  },
  test: {
    use_env_variable: 'DATABASE_URL_TEST',
    dialect: "postgres",
    ssl: {
      rejectUnauthorized: false,
    },
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    ssl: {
      rejectUnauthorized: false,
    },
  }
}
