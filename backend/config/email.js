// const nodemailer = require("nodemailer");
// const {
//     userMail,
//     passMail,
// } = require("../.env");

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: userMail,
//         pass: passMail,
//     },
// });

// module.exports = async (dest, title, body) => {
//     transporter.sendMail({
//         to: dest,
//         from: 'Equipe Esclareça ' +userMail,
//         cco: userMail,
//         subject: title,
//         html: body,
//     });
// }
const { s3Config_accessKeyId, s3Config_secretAccessKey } = require("../.env");
const { userMail } = require("../.env");
const AWS = require('aws-sdk');

const SESConfig = {
    apiVersion: '2010-12-01',
    accessKeyId: s3Config_accessKeyId,
    secretAccessKey: s3Config_secretAccessKey,
    region: 'us-east-1'
};

module.exports = async (dest, title, body) => {
    var params = {
        Source: userMail,
        Destination: {
            ToAddresses: [
                dest
            ]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: body
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: title
            }
        }
    };

    new AWS.SES(SESConfig).sendEmail(params).promise().then((res) => {
        console.log(res);
    });
}