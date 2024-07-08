require('dotenv').config()

module.exports = {
  development: {
    username: "root",
    password: "root",
    database: "authapp_dev",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  test: {
    username: "root",
    password: "root",
    database: "authapp_dev",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    use_env_variable: 'HEROKU_POSTGRESQL_YELLOW_URL',
    dialect: "postgres"
  }
}
