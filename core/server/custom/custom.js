var bodyParser = require('body-parser');
var mailer = require("nodemailer");
var customConfig = require("./custom-config");

var db = require("./custom-db");

module.exports = function(parentApp) {
    
    var urlencodedParser = bodyParser.urlencoded({ extended: false })


    parentApp.get('/contact', function(req, res) {
        
        var subject = req.query['subject'];

        var model = {
            subject: subject,
            isRequest: !!subject
        };

        res.render('custom/contact', model);
        
    })

    parentApp.post('/contact', urlencodedParser, function(req, res) {
        
        var subject = req.body['subject'];
        var body = req.body['body'];
        var email = req.body['email'];
        var name = req.body['name'];
        var company = req.body['company'];
        var isRequest = req.body['isRequest'];

        var model = {
            subject: subject,
            body: body,
            email: email,
            name: name,
            company: company,
            isRequest: isRequest
        };

        if (!body || !name || !email) {
            model.hasValidationError = true;
            res.render('custom/contact', model);
            return;
        }

        var smtpTransport = mailer.createTransport("SMTP", customConfig.smtpConfig);

        var text = "Name: " + name + "\n";
        text += "Email: " + email + "\n";
        if (company) text += "Company: " + company + "\n";
        text += '\n';
        text += body;

        var mail = {
            from:  customConfig.emailFrom,
            to:  customConfig.emailTo,
            subject: "[Anfrage] " + ( subject || 'Anfrage von Website' ),
            text: text
        }

        smtpTransport.sendMail(mail, function(error, response){
            if(error){
                console.log(error);
                model.hasSendError = true;
                res.render('custom/contact', model);
            }
            else {
                model.isSuccess = true;
                res.render('custom/contact', model);
            }

            smtpTransport.close();
        });

    });

    parentApp.get('/request-book', function(req, res) {
        res.render('custom/request-book');
    })

    parentApp.post('/request-book', urlencodedParser, function(req, res) {
        var email = req.body['email'];
        var notify = req.body['notify'] || 0;
        var word = req.body['word'];

        var model = {
            email: email,
            notify: notify,
            word: word
        }

        if (!email) {
            model.hasValidationError = true;
            res.render('custom/request-book', model);
            return;
        }

        db.get(
            "select * from readers where email = ?",
            email,
            function(err, row) {
                if (!row) {
                    db.run(
                        "INSERT INTO readers(email,date,notify) values(?, ?, ?)",
                        email,
                        new Date().toISOString(),
                        notify);
                }
                else {
                    db.run(
                        "update readers set date = ?, notify = ? where email = ?",
                        new Date().toISOString(),
                        notify,
                        email);
                }
            }
        );

        var smtpTransport = mailer.createTransport("SMTP", customConfig.smtpConfig);

        var text = "Hallo,\n\ndanke für Dein Interesse an unserem Buch.\n\nDie Infos zum Buch findest Du hier:\n"
                    + "\t" + customConfig.bookLink + "\n\n"
                    + "Folge uns auf Twitter oder Facebook um keine unserer Infos rund um Angular zu verpassen:\n"
                    + "\t" + customConfig.twitterLink + "\n"
                    + "\t" + customConfig.facebookLink +"\n\n"
                    + "Schöne Grüße\n"
                    + "Manfred Steyer";

        var mail = {
            from: customConfig.emailFrom,
            to: email,
            subject: "Deine Unterlagen zum Angular-Buch",
            text: text
        }

        console.log('mail', mail);

        smtpTransport.sendMail(mail, function(error, response){
            if(error){
                console.log(error);
                model.hasSendError = true;
                res.render('custom/request-book', model);
            }
            else {
                model.isSuccess = true;
                res.render('custom/request-book', model);
            }

            smtpTransport.close();
        });






    });


}