require('dotenv').config()
const express = require('express')
const { sequelize, User, Organisation } = require('./models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { UUIDV4 } = require('sequelize')


const app = express()
app.use(express.json())
const PORT = process.env.PORT
const JWT_SECRET = process.env.JWT_SECRET

const authenticateToken = (req, res, next) => {
        const token = req.header('Authorization').split(' ')[1]
        if (!token) return res.status(401).json({message: 'No token'})
        jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) res.status(403).json({message: 'Invalid or expired token'})
        req.user = user
    next()
})
}

app.post('/auth/register', async(req, res) =>{
    const {firstName, lastName, email, password, phone} = req.body
    try {
        const hashedPassword = bcrypt.hash(password, 10)
        const user = await User.create({userId: UUIDV4(), firstName, lastName, email, password:hashedPassword, phone})
        const org = await Organisation.create({orgId: UUIDV4(), name: `${firstName}'s Organisation`, description: ''})
        await user.addOrganisation(org)
        const accessToken = jwt.sign({userId: user.userId, email: user.email}, JWT_SECRET)
        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {accessToken, user}
        })
    } catch (error) {
        res.status(400).json({
            status: 'Bad request',
            message: 'Unsuccessful registration',
            statusCode: 400
        })
    }
})

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.findOne({where: { email }})
        if (!user) return res.status(401).json({
            status: 'Bad request', 
            message: 'Authentication failed', 
            statusCode: 401
        })
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) return res.status(401).json({
            status: 'Bad request', 
            message: 'Authentication failed', 
            statusCode: 401
        })
        const accessToken = jwt.sign({userId: user.userId, email: user.email}, JWT_SECRET)
        res.status(200).json({
            status: success,
            message: 'Login successful',
            data: {accessToken, user}
        })
    } catch (error) {
        res.status(400).json({
            status: 'Bad request',
            message: 'Authentication failed',
            statusCode: 401
        })
    }
})

app.get('/api/users/:id', authenticateToken, async(req, res) => {
    const { id } = req.params
    if (id !== req.user.userId) return res.status(403).json({
        status: 'Unauthorized',
        message: 'Access denied',
        statusCode: 403
    })
    try {
        const user = await User.findOne({where: {userId: id}})
        if (!user) return res.status(404).json({
            status: 'Not found',
            message: 'User record not found',
            statusCode: 404
        })
        res.status(200).json({
            status: 'success',
            message: 'User record retrieved successfully',
            data: {
                userId: user.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone
            }
        })
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

app.get('/api/organisations', authenticateToken, async(req, res) => {
    const { userId } = req.user
    try {
        const user = await Organisation.findOne({where: {userId},
        include: [{
            model: Organisation,
            through: {attributes: []}
        }]
        })
        if (!user) return res.status(404).json({
            status: 'Not found',
            message: 'User record not found',
            statusCode: 404
        })
        res.status(200).json({
            status: 'success',
            message: 'Organisations retrieved successfully',
            data: {
                organisations: user.Organisation
            }
        })
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        })
    }
})

app.get('/api/organisations/:orgId', authenticateToken, async(req, res) => {
    try {
        const { orgId } = req.params
        const { userId } = req.user
        const user = await User.findOne({
            where: {userId},
            include: [{
                model: Organisation,
                through: {
                    attributes: []
                },
                where: {orgId},
                required: true
            }]
        })
        if (!user || user.Organisation.length === 0) return res.status(404).json({
            status: 'Not found',
            message: 'Organisation record not found or user does not have access to this organization',
            statusCode: 404
        })
        res.status(200).json({
            status: 'success',
            message: 'Organisation record retrieved successfully',
            data: user.Organisation[0],
        })
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

app.post('/api/organisations', authenticateToken, async(req, res) => {
    try {
        const userId = req.user.userId
        const { name, description } = req.body
        if (!name) return res.status(400).json({
            status: 'Bad request',
            message: "Client error",
            statusCode: 400
        })
        const org = await Organisation.create({
            orgId: UUIDV4(),
            name,
            description
        })
        const user = await User.findOne({where: { userId }})
        await user.addOrganisation(org)
        res.status(201).json({
            status: 'success',
            message: 'Organisation created successfully',
            data: {
                orgId: org.orgId,
                name: org.name,
                description: org.description
            }
        })
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        })
    }
})

app.post('/api/organisations/:orgId/users', authenticateToken,async(req, res) => {
    const { orgId } = req.params
    const { userId } = req.body
    if (!userId) return res.status(400).json({
        status: 'Bad request',
        message: 'User ID required',
        statusCode: 400
    })
    const user = user.findOne({where: {userId: req.user.userId}})
    if (!user) return res.status(403).json({
        status: 'Unauthorized',
        message: 'Forbidden',
        statusCode: 403
    })
    const newUser = user.findOne({where: {userId}})
    if (!user) return res.status(404).json({
        status: 'Not found',
        message: 'User not found',
        statusCode: 404
    })
    const userOrg = await User.findOne({
        where: {userId},
        include: [{
            model: Organisation,
            through: {
                attributes: []
            },
            where: {orgId},
            required: true
        }]
    })
    if (!userOrg)  return res.status(404).json({
        status: 'Not found',
        message: 'No Organization with supplied ID',
        statusCode: 404
    })
    await newUser.addOrganisation(userOrg.Organisation)
    res.status(200).json({
        status: 'success',
        message: "User added to organization successfully"
    })
})

app.listen(PORT, async() => {
    try {
        await sequelize.sync({force: true})
        console.log('Database synced')
        console.log(`Server is running on port ${PORT}`)
    } catch (error) {
        console.error('Unable to sync database', error)
    }
})