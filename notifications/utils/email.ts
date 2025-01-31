import nodemailer, { Transporter } from "nodemailer";
import pug from "pug";
import { htmlToText } from "html-to-text";
import path from "path";

interface Email {
  to: string;
  firstName: string;
  from: string;
  order: any;
  products: any;
  transaction: any;
}

class Email {
  constructor(user: any, order: any, transaction: any) {
    this.to = user.email;
    this.firstName = user.username.split(" ")[0];
    this.order = order;
    this.products = order.products;
    this.transaction = transaction;
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
    console.log(__dirname);
    console.log(this.transaction)

    const templatePath = path.resolve(
      __dirname,
      "..",
      "views",
      "email",
      `${template}.pug`
    );

    console.log("Resolved Template Path:", templatePath);
    const html = pug.renderFile(templatePath, {
      firstName: this.firstName,
      orderNumber: this.order.id,
      orderItems: this.products,
      paymentMethod: this.transaction.payment_method,
      paymentStatus: this.transaction.status,
      paymentCurrency: this.transaction.currency,
      totalAmount: this.order.total_amount,
      subject,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendReceipt() {
    await this.send("receipt", "Your latest purchase receipt");
  }
}

export default Email;
