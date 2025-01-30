import nodemailer, { Transporter } from "nodemailer";
import pug from "pug";
import { htmlToText } from "html-to-text";

interface Email {
  to: string;
  firstName: string;
  from: string;
}

class Email {
  constructor(user: any, products:any) {
    this.to = user.email;
    this.firstName = user.username.split(" ")[0];
    this.from = ` Shoply Corp. <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template: any, subject: string) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      subject,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    await this.newTransport().sendMail(mailOptions)
  }


  async sendReceipt(){
    await this.send("receipt", "Your latest purchase receipt")
  }
}
