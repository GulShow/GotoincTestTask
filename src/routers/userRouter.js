const express = require('express')
require('../db/mongoose')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const sharp = require('sharp')
const auth = require('../authentication/auth')
const {sendWelcomEmail, sendByeEmail} = require('../emails/accout')


const upload = multer({
    limits: {
        fileSize: 2000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            callback(new Error('File must be a picture!'))
        }
        callback(undefined, true)
    }
})

const userRouter = new express.Router()

userRouter.get('/users/me' , auth, async  (req, res) => {
    res.send(req.user)
})

userRouter.get('/users/:id', async (req, res) => {
    const _id = req.params.id

    try {
        const user = await User.findById(_id)
        if (!user) {
            res.status(404)
            return res.send({
                error: "User not found!"
            })
        }
        res.send(user)
    }
    catch (e) {
        res.status(404)
        return res.send({
            error: "User not found!"
        })
    }
})

userRouter.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    }
    catch (e) {
        res.status(404).send()
    }
})

userRouter.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    }
    catch (error) {
        res.status(400)
        res.send({
            error: error.message
        })
    }
})

userRouter.post('/users/login', async (req ,res) => {
    try {
        const user = await User.findByEmail(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    }
    catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
})

userRouter.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    }
    catch (e) {
        res.status(500).send()
    }
})

userRouter.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    }
    catch (e) {
        res.status(500).send()
    }
})


userRouter.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer()

    req.user.avatar = buffer

    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({
        error: error.message
    })
})

userRouter.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendByeEmail(req.user.email, req.user.name)
        res.send(req.user)
    }
    catch (e) {
        res.status(500).send({
            error: e
        })
    }
})

userRouter.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    try {
        await req.user.save()
        res.send()
    }
    catch (e) {
        res.send(400).send({
            error: e.message
        })
    }  
})


userRouter.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdate = ['name', 'email', 'password'] 
    const isValidUpdate = updates.every((update) => allowedUpdate.includes(update))
    if (!isValidUpdate) {
        return res.status(400).send({
            error: "Invalid updates!"
        })
    }
    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    }
    catch (e) {
        res.status(400).send({
            error: e
        })
    }
})




module.exports = userRouter