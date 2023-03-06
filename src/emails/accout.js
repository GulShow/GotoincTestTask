const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'stgulyaev23@gmail.com',
        subject: 'Thanks for sign up!',
        text: `Welcome, ${name}!`
    })
}

const sendByeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'stgulyaev23@gmail.com',
        subject: 'Bye!',
        text: `We are sorry, ${name}!`
    })
}

module.exports = {
    sendWelcomEmail,
    sendByeEmail
}