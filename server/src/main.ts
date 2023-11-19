import path from "path";
import express,
    {Express, NextFunction, Request, Response} from "express";
import {serverInfo} from "./ServerInfo";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";
import * as Contacts from "./contacts";
import {IContact} from "./contacts";

//creates Express app
const app: Express = express();

//parse html body with json
app.use(express.json());

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});


//set locations for static resources for client
app.use("/",
    express.static(path.join(__dirname, "../../client/dist"))
);

//CORS
app.use(function (inRequest: Request, inResponse: Response, inNext:NextFunction){
    //set allow domains
    inResponse.header("Access-Control-Allow-Origin", "*");
    //set allow http methods
    inResponse.header("Access-Control-Allow-Methods",
        "GET,POST,DELETE,PUT,OPTIONS"
    );
    inResponse.header("Access-Control-Allow-Headers",
        "Origin,X-Requested-With,Content-Type,Accept"
    );
    //form a chain
    inNext();
});

//Restful Endpoints
//get list of mailboxes
app.get("/mailboxes",
    async (inRequest: Request, inResponse: Response) => {
        try{
            //instantiate imap worker and return the array of mailboxes in json to caller
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            const mailboxes: IMAP.IMailbox[] = await imapWorker.listMailboxes();
            inResponse.json(mailboxes);
        }catch (inError){
            inResponse.send("error");
        }
    }
    );

//getting list of messages in a specific mailbox
app.get("/mailboxes/:mailbox",
    async (inRequest:Request, inResponse: Response) => {
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            const messages: IMAP.IMessage[] = await imapWorker.listMessages({
                mailbox: inRequest.params.mailbox
            });
            inResponse.json(messages);
        }catch (inError){
            inResponse.send("error");
        }
    }
    );

//getting contents of a specific message
app.get("/messages/:mailbox/:id",
    async (inRequest: Request, inResponse: Response)=>{
        try{
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            const messageBody: String = await imapWorker.getMessageBody({
                mailbox : inRequest.params.mailbox,
                id : parseInt(inRequest.params.id, 10)
            });
            inResponse.send(messageBody);
        }catch (inError){
            inResponse.send("error");
        }
    }
    );

//delete a message
app.delete("/messages/:mailbox/:id",
    async (inRequest: Request, inResponse: Response)=>{
        try{
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            await imapWorker.deleteMessage({
                mailbox : inRequest.params.mailbox,
                id : parseInt(inRequest.params.id, 10)
            });
            inResponse.send("delete message successfully");
        }catch (inError){
            inResponse.send("error");
        }
    }
);

//send a message
app.post("/messages",
    async (inRequest: Request, inResponse: Response)=>{
        try{
            const smtpWorker: SMTP.Worker = new SMTP.Worker(serverInfo);
            await smtpWorker.sendMessage(inRequest.body);
            inResponse.send("send message successfully");
        }catch (inError){
            inResponse.send("error");
        }
    }
);

//list contacts
app.get("/contacts",
    async (inRequest: Request, inResponse: Response)=>{
        try{
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            const contacts: IContact[] = await contactsWorker.listContacts();
            inResponse.json(contacts);
        }catch (inError){
            inResponse.status(500).send("error");
        }
    }
);

//add contact
app.post("/contacts",
    async (inRequest: Request, inResponse: Response)=>{
        try{
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            const contact: IContact = await contactsWorker.addContact(inRequest.body);
            inResponse.json(contact);
        }catch (inError){
            inResponse.send("error");
        }
    }
);

//delete contact
app.delete("/contacts/:id",
    async (inRequest: Request, inResponse: Response)=>{
        try{
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            await contactsWorker.deleteContact(inRequest.params.id);
            inResponse.status(200).send("delete contact successfully");
        }catch (inError){
            inResponse.send("error");
        }
    }
);

//update contact
app.put("/contacts/:id",
    async (inRequest: Request, inResponse: Response)=>{
        try{
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            await contactsWorker.updateContact(inRequest.params.id, inRequest.body);
            inResponse.send("update contact successfully");
        }catch (inError){
            inResponse.send("error");
        }
    }
    );