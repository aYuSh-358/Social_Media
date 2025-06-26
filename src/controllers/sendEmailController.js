const nodemailer = require("nodemailer");
const fs = require("fs");
const { promisify } = require("util");
const readFileAsync = promisify(fs.readFile);

module.exports.sendEmail = async (user) => {
  // const imageAttachment = await readFileAsync(
  //   "../../..//Project/Social_Media/uploads/mail/hsmlogo.png"
  // );
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "ayush.dongre.btechcyb@ghrietn.raisoni.net",
      pass: "deesdrzftuhbqcvr",
    },
  });

  (async () => {
    const info = await transporter.sendMail({
      from: '"Ayush" <ayush.dongre.btechcyb@ghrietn.raisoni.net>',
      to: user.userEmail,
      subject: "Registered Successfully",
      text: `Hellow ${user.userName}`,
      html: `<h1>Hello ${user.userName},</h1>
        <h3>You registered successfully</h3>
    // <img src="cid:hsmlogo" alt="Embedded Image">`,
      //   attachments: [
      //     {
      //       filename: "image.png",
      //       content: imageAttachment,
      //       encoding: "base64",
      //       cid: "hsmlogo",
      //     },
      //     {
      //       filename: "hsmlogo.png",
      //       path: __dirname + "../../../uploads/mail/hsmlogo.png",
      //       cid: "uniq-hsmlogo.png",
      //     },
      //   ],
    });
    // console.log("Message sent:", info.messageId,);
  })();
};
