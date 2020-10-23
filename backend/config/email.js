const nodemailer = require("nodemailer");
const {
    userMail,
    passMail,
} = require("../.env");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: userMail,
        pass: passMail,
    },
});

module.exports = async (dest, title, body) => {
    transporter.sendMail({
        to: dest,
        from: 'Equipe Esclareça ' +userMail,
        cco: userMail,
        subject: title,
        html: body,
    });
}
